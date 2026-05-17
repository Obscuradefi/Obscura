const { expect } = require('chai');
const { ethers } = require('hardhat');

const FEED_GOLD = '0x' + '22'.repeat(32);
const FEED_USD_JPY = '0x' + '44'.repeat(32);
const FEED_EUR_USD = '0x' + '55'.repeat(32);

async function plant(mockPyth, id, priceUSD, expo = -8) {
  const scaled = BigInt(Math.round(priceUSD * 10 ** -expo));
  await mockPyth.setPrice(id, scaled, 0n, expo, 0n);
}

describe('ObscuraAMM (Pyth-priced)', () => {
  let usdc, gold, jpyc, eurc, mockPyth, amm, owner, alice;

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();

    const MockPyth = await ethers.getContractFactory('MockPyth');
    mockPyth = await MockPyth.deploy();

    const MockToken = await ethers.getContractFactory('MockToken');
    // USDC mock: 6 dec, large faucet
    usdc = await MockToken.deploy('Mock USDC', 'USDC', 6, 0n, 1_000_000n * 10n ** 6n);
    // GOLD: 18 dec
    gold = await MockToken.deploy('Mock GOLD', 'GOLD', 18, 0n, 100n * 10n ** 18n);
    // JPYC: 18 dec, used as inverted-feed test (USD/JPY)
    jpyc = await MockToken.deploy('Mock JPYC', 'JPYC', 18, 0n, 1_000_000n * 10n ** 18n);
    // EURC mock: 6 dec to mirror real Arc EURC
    eurc = await MockToken.deploy('Mock EURC', 'EURC', 6, 0n, 1_000_000n * 10n ** 6n);

    const AMM = await ethers.getContractFactory('ObscuraAMM');
    amm = await AMM.deploy(await usdc.getAddress(), await mockPyth.getAddress());

    // Plant prices.
    await plant(mockPyth, FEED_GOLD, 4500);       // GOLD/USD = $4500
    await plant(mockPyth, FEED_USD_JPY, 150, -3); // USD/JPY = 150 yen per dollar
    await plant(mockPyth, FEED_EUR_USD, 1.08);    // EUR/USD = $1.08

    await amm.listAsset(await gold.getAddress(), FEED_GOLD, 18, false);
    await amm.listAsset(await jpyc.getAddress(), FEED_USD_JPY, 18, true /* inverted */);
    await amm.listAsset(await eurc.getAddress(), FEED_EUR_USD, 6, false);

    // Fund owner via faucets and seed pools.
    for (let i = 0; i < 5; i++) await usdc.mint();
    for (let i = 0; i < 1; i++) await gold.mint();
    for (let i = 0; i < 1; i++) await jpyc.mint();
    for (let i = 0; i < 5; i++) await eurc.mint();

    // GOLD pool: 1 GOLD + 4500 USDC.
    await usdc.approve(await amm.getAddress(), 100_000n * 10n ** 6n);
    await gold.approve(await amm.getAddress(), 5n * 10n ** 18n);
    await amm.addLiquidity(
      await gold.getAddress(),
      1n * 10n ** 18n,
      4500n * 10n ** 6n
    );

    // JPYC pool: 1500 JPYC + 10 USDC (≈ $0.00667 per JPY).
    await jpyc.approve(await amm.getAddress(), 100_000n * 10n ** 18n);
    await amm.addLiquidity(
      await jpyc.getAddress(),
      1500n * 10n ** 18n,
      10n * 10n ** 6n
    );

    // EURC pool: 4.6 EURC + 5 USDC.
    await eurc.approve(await amm.getAddress(), 1_000_000n * 10n ** 6n);
    await amm.addLiquidity(
      await eurc.getAddress(),
      4_600_000n,
      5_000_000n
    );
  });

  it('quotes USDC -> GOLD at the Pyth price (less the 0.30% fee)', async () => {
    const out = await amm.getAmountOut(
      await usdc.getAddress(),
      await gold.getAddress(),
      100n * 10n ** 6n
    );
    const expected = (100n * 10n ** 18n * 9970n) / (4500n * 10n ** 4n);
    expect(out).to.be.closeTo(expected, 10n ** 10n);
  });

  it('quotes USDC -> JPYC using inverted Pyth feed (USD/JPY)', async () => {
    // 1 USDC at USD/JPY=150 -> ~150 JPY * 0.997 fee = 149.55 JPYC.
    // raw: 1e6 USDC -> ? JPYC (18 dec).
    const out = await amm.getAmountOut(
      await usdc.getAddress(),
      await jpyc.getAddress(),
      1_000_000n // 1 USDC
    );
    // Allow ±1 yen tolerance for rounding.
    const expectedLow = 149n * 10n ** 18n;
    const expectedHigh = 150n * 10n ** 18n;
    expect(out).to.be.gte(expectedLow);
    expect(out).to.be.lte(expectedHigh);
  });

  it('quotes USDC -> EURC at EUR/USD with fee', async () => {
    // 1.08 USDC should buy roughly 1 EURC * 0.997.
    const out = await amm.getAmountOut(
      await usdc.getAddress(),
      await eurc.getAddress(),
      1_080_000n // 1.08 USDC
    );
    // Expected: ~1 EURC * 0.997 = 997_000 raw EURC.
    expect(out).to.be.gte(995_000n);
    expect(out).to.be.lte(998_000n);
  });

  it('reflects updated Pyth prices in the next quote', async () => {
    const before = await amm.getAmountOut(
      await usdc.getAddress(),
      await gold.getAddress(),
      100n * 10n ** 6n
    );
    await plant(mockPyth, FEED_GOLD, 5000);
    const after = await amm.getAmountOut(
      await usdc.getAddress(),
      await gold.getAddress(),
      100n * 10n ** 6n
    );
    expect(after).to.be.lt(before);
  });

  it('executes USDC -> GOLD swap respecting slippage', async () => {
    for (let i = 0; i < 1; i++) await usdc.connect(alice).mint();
    await usdc.connect(alice).approve(await amm.getAddress(), 100n * 10n ** 6n);

    const expected = await amm.getAmountOut(
      await usdc.getAddress(),
      await gold.getAddress(),
      100n * 10n ** 6n
    );
    const min = (expected * 99n) / 100n;
    await expect(
      amm.connect(alice).swap(
        await usdc.getAddress(),
        await gold.getAddress(),
        100n * 10n ** 6n,
        min
      )
    ).to.emit(amm, 'Swap');
    expect(await gold.balanceOf(alice.address)).to.be.gte(min);
  });

  it('reverts on excessive slippage', async () => {
    for (let i = 0; i < 1; i++) await usdc.connect(alice).mint();
    await usdc.connect(alice).approve(await amm.getAddress(), 100n * 10n ** 6n);
    const expected = await amm.getAmountOut(
      await usdc.getAddress(),
      await gold.getAddress(),
      100n * 10n ** 6n
    );
    await expect(
      amm.connect(alice).swap(
        await usdc.getAddress(),
        await gold.getAddress(),
        100n * 10n ** 6n,
        expected * 2n
      )
    ).to.be.revertedWith('AMM: slippage');
  });

  it('routes cross-asset (EURC -> JPYC via USDC) and charges fee once', async () => {
    for (let i = 0; i < 5; i++) await eurc.connect(alice).mint();
    await eurc.connect(alice).approve(await amm.getAddress(), 1_000_000n);

    // 1 EURC -> JPYC: 1.08 USDC -> ~162 JPYC * 0.997 = ~161.5 JPYC
    const out = await amm.getAmountOut(
      await eurc.getAddress(),
      await jpyc.getAddress(),
      1_000_000n
    );
    expect(out).to.be.gte(160n * 10n ** 18n);
    expect(out).to.be.lte(165n * 10n ** 18n);

    await expect(
      amm.connect(alice).swap(
        await eurc.getAddress(),
        await jpyc.getAddress(),
        1_000_000n,
        (out * 99n) / 100n
      )
    ).to.emit(amm, 'Swap');
  });
});

describe('ObscuraRFQ', () => {
  let usdc, gold, mockPyth, rfq, owner, maker, taker;

  // EIP-712 helpers
  let domain;
  const types = {
    Quote: [
      { name: 'quoteId', type: 'bytes32' },
      { name: 'maker', type: 'address' },
      { name: 'taker', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOut', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
  };

  beforeEach(async () => {
    [owner, maker, taker] = await ethers.getSigners();

    const MockPyth = await ethers.getContractFactory('MockPyth');
    mockPyth = await MockPyth.deploy();

    const MockToken = await ethers.getContractFactory('MockToken');
    usdc = await MockToken.deploy('Mock USDC', 'USDC', 6, 0n, 100_000n * 10n ** 6n);
    gold = await MockToken.deploy('Mock GOLD', 'GOLD', 18, 0n, 100n * 10n ** 18n);

    await plant(mockPyth, FEED_GOLD, 4500);

    const RFQ = await ethers.getContractFactory('ObscuraRFQ');
    rfq = await RFQ.deploy(await mockPyth.getAddress());

    await rfq.setMaker(maker.address, true);
    await rfq.listUSDC(await usdc.getAddress());
    await rfq.listAsset(await gold.getAddress(), FEED_GOLD, 18, false);

    domain = {
      name: 'ObscuraRFQ',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await rfq.getAddress(),
    };

    // Fund maker with GOLD inventory and taker with USDC.
    for (let i = 0; i < 1; i++) await gold.connect(maker).mint(); // 100 GOLD
    for (let i = 0; i < 1; i++) await usdc.connect(taker).mint(); // 100k USDC

    await gold.connect(maker).approve(await rfq.getAddress(), ethers.MaxUint256);
    await usdc.connect(taker).approve(await rfq.getAddress(), ethers.MaxUint256);
  });

  async function buildQuote(overrides = {}) {
    const base = {
      quoteId: ethers.hexlify(ethers.randomBytes(32)),
      maker: maker.address,
      taker: ethers.ZeroAddress,
      tokenIn: await usdc.getAddress(),
      tokenOut: await gold.getAddress(),
      amountIn: 4500n * 10n ** 6n,           // 4500 USDC
      amountOut: 1n * 10n ** 18n,            // 1 GOLD (perfect oracle match)
      expiry: BigInt(Math.floor(Date.now() / 1000) + 600),
    };
    const q = { ...base, ...overrides };
    const signature = await maker.signTypedData(domain, types, q);
    return { quote: q, signature };
  }

  it('settles a maker-signed quote at the oracle price', async () => {
    const { quote, signature } = await buildQuote();
    await expect(
      rfq.connect(taker).settle(
        quote.quoteId,
        quote.maker,
        quote.taker,
        quote.tokenIn,
        quote.tokenOut,
        quote.amountIn,
        quote.amountOut,
        quote.expiry,
        signature
      )
    ).to.emit(rfq, 'Settled');

    expect(await gold.balanceOf(taker.address)).to.equal(quote.amountOut);
  });

  it('rejects a quote outside the Pyth deviation band', async () => {
    // Maker offers 2 GOLD for 4500 USDC -> 100% over fair. Should revert.
    const { quote, signature } = await buildQuote({ amountOut: 2n * 10n ** 18n });
    await expect(
      rfq.connect(taker).settle(
        quote.quoteId,
        quote.maker,
        quote.taker,
        quote.tokenIn,
        quote.tokenOut,
        quote.amountIn,
        quote.amountOut,
        quote.expiry,
        signature
      )
    ).to.be.revertedWith('RFQ: deviation');
  });

  it('rejects expired quotes', async () => {
    const { quote, signature } = await buildQuote({
      expiry: BigInt(Math.floor(Date.now() / 1000) - 1),
    });
    await expect(
      rfq.connect(taker).settle(
        quote.quoteId,
        quote.maker,
        quote.taker,
        quote.tokenIn,
        quote.tokenOut,
        quote.amountIn,
        quote.amountOut,
        quote.expiry,
        signature
      )
    ).to.be.revertedWith('RFQ: expired');
  });

  it('rejects replay of the same quoteId', async () => {
    const { quote, signature } = await buildQuote();
    await rfq.connect(taker).settle(
      quote.quoteId,
      quote.maker,
      quote.taker,
      quote.tokenIn,
      quote.tokenOut,
      quote.amountIn,
      quote.amountOut,
      quote.expiry,
      signature
    );
    await expect(
      rfq.connect(taker).settle(
        quote.quoteId,
        quote.maker,
        quote.taker,
        quote.tokenIn,
        quote.tokenOut,
        quote.amountIn,
        quote.amountOut,
        quote.expiry,
        signature
      )
    ).to.be.revertedWith('RFQ: filled');
  });

  it('rejects quotes from non-whitelisted makers', async () => {
    await rfq.setMaker(maker.address, false);
    const { quote, signature } = await buildQuote();
    await expect(
      rfq.connect(taker).settle(
        quote.quoteId,
        quote.maker,
        quote.taker,
        quote.tokenIn,
        quote.tokenOut,
        quote.amountIn,
        quote.amountOut,
        quote.expiry,
        signature
      )
    ).to.be.revertedWith('RFQ: bad maker');
  });

  it('rejects tampered signatures', async () => {
    const { quote, signature } = await buildQuote();
    const tamperedAmount = quote.amountOut * 2n;
    await expect(
      rfq.connect(taker).settle(
        quote.quoteId,
        quote.maker,
        quote.taker,
        quote.tokenIn,
        quote.tokenOut,
        quote.amountIn,
        tamperedAmount, // mismatch -> sig recovers wrong signer
        quote.expiry,
        signature
      )
    ).to.be.reverted; // either bad sig or deviation depending on order
  });
});

describe('ObscuraShield', () => {
  let usdc, shield, alice;

  beforeEach(async () => {
    [, alice] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory('MockToken');
    usdc = await MockToken.deploy('Mock USDC', 'USDC', 6, 0n, 1_000n * 10n ** 6n);

    const Shield = await ethers.getContractFactory('ObscuraShield');
    shield = await Shield.deploy();
    await shield.setAssetWhitelist(await usdc.getAddress(), true);
  });

  it('rejects deposits of non-whitelisted assets', async () => {
    const MockToken = await ethers.getContractFactory('MockToken');
    const rogue = await MockToken.deploy('Rogue', 'RGE', 18, 0n, 1n * 10n ** 18n);
    await rogue.connect(alice).mint();
    await rogue.connect(alice).approve(await shield.getAddress(), 1n * 10n ** 18n);
    await expect(
      shield
        .connect(alice)
        .shield(await rogue.getAddress(), 1n * 10n ** 18n, 0, ethers.ZeroHash)
    ).to.be.revertedWith('Shield: asset not allowed');
  });

  it('shields LOW (no lock) and unshields immediately', async () => {
    await usdc.connect(alice).mint();
    const amt = 100n * 10n ** 6n;
    await usdc.connect(alice).approve(await shield.getAddress(), amt);
    await expect(
      shield.connect(alice).shield(await usdc.getAddress(), amt, 0, ethers.ZeroHash)
    ).to.emit(shield, 'Shielded');
    expect(await shield.encryptedBalance(alice.address, await usdc.getAddress())).to.equal(amt);
    await expect(
      shield.connect(alice).unshield(await usdc.getAddress(), 0, ethers.ZeroHash)
    ).to.emit(shield, 'Unshielded');
  });

  it('blocks unshield of HIGH-level deposit before lock window', async () => {
    await usdc.connect(alice).mint();
    const amt = 50n * 10n ** 6n;
    await usdc.connect(alice).approve(await shield.getAddress(), amt);
    await shield.connect(alice).shield(await usdc.getAddress(), amt, 2, ethers.ZeroHash);
    await expect(
      shield.connect(alice).unshield(await usdc.getAddress(), 0, ethers.ZeroHash)
    ).to.be.revertedWith('Shield: locked');
  });

  it('honors per-level lock changes by admin', async () => {
    await shield.setLevelLock(2, 60);
    await usdc.connect(alice).mint();
    const amt = 25n * 10n ** 6n;
    await usdc.connect(alice).approve(await shield.getAddress(), amt);
    await shield.connect(alice).shield(await usdc.getAddress(), amt, 2, ethers.ZeroHash);

    await ethers.provider.send('evm_increaseTime', [70]);
    await ethers.provider.send('evm_mine', []);

    await expect(
      shield.connect(alice).unshield(await usdc.getAddress(), 0, ethers.ZeroHash)
    ).to.emit(shield, 'Unshielded');
  });
});

describe('ObscuraNanopay', () => {
  let usdc, nano, payer, payee;

  let domain;
  const types = {
    ChannelClaim: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'payer', type: 'address' },
      { name: 'payee', type: 'address' },
      { name: 'totalSpent', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  beforeEach(async () => {
    [, payer, payee] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory('MockToken');
    usdc = await MockToken.deploy('Mock USDC', 'USDC', 6, 0n, 1_000n * 10n ** 6n);

    const Nano = await ethers.getContractFactory('ObscuraNanopay');
    nano = await Nano.deploy(await usdc.getAddress());

    domain = {
      name: 'ObscuraNanopay',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await nano.getAddress(),
    };

    // Fund payer.
    await usdc.connect(payer).mint();
    await usdc.connect(payer).approve(await nano.getAddress(), ethers.MaxUint256);
  });

  async function openChannel(deposit) {
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const tx = await nano.connect(payer).openChannel(payee.address, deposit, salt);
    await tx.wait();
    const channelId = await nano.quoteId(payer.address, payee.address, salt);
    return channelId;
  }

  it('opens a channel and lets the payee claim a payer-signed total', async () => {
    const channelId = await openChannel(10n * 10n ** 6n); // 10 USDC

    const totalSpent = 25_000n; // 0.025 USDC
    const nonce = 1n;
    const sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });

    await expect(nano.connect(payee).claim(channelId, totalSpent, nonce, sig))
      .to.emit(nano, 'ChannelClaim')
      .withArgs(channelId, payee.address, totalSpent, totalSpent, nonce);

    expect(await usdc.balanceOf(payee.address)).to.equal(totalSpent);
  });

  it('accumulates incrementally across multiple claims', async () => {
    const channelId = await openChannel(10n * 10n ** 6n);

    // First claim: 100 micro-USDC.
    let totalSpent = 100_000n;
    let nonce = 1n;
    let sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });
    await nano.connect(payee).claim(channelId, totalSpent, nonce, sig);

    // Second claim: 350 micro-USDC total (so 250 increment).
    totalSpent = 350_000n;
    nonce = 2n;
    sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });
    await nano.connect(payee).claim(channelId, totalSpent, nonce, sig);

    expect(await usdc.balanceOf(payee.address)).to.equal(350_000n);
  });

  it('rejects regressing totals', async () => {
    const channelId = await openChannel(10n * 10n ** 6n);

    let totalSpent = 200_000n;
    let nonce = 1n;
    let sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });
    await nano.connect(payee).claim(channelId, totalSpent, nonce, sig);

    // Try a smaller totalSpent.
    totalSpent = 100_000n;
    nonce = 2n;
    sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });
    await expect(
      nano.connect(payee).claim(channelId, totalSpent, nonce, sig)
    ).to.be.revertedWith('Nanopay: regress');
  });

  it('rejects stale nonces', async () => {
    const channelId = await openChannel(10n * 10n ** 6n);
    const nonce = 5n;
    const totalSpent = 50_000n;
    const sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });
    await nano.connect(payee).claim(channelId, totalSpent, nonce, sig);

    // Replay with same nonce.
    await expect(
      nano.connect(payee).claim(channelId, totalSpent + 1n, nonce, sig)
    ).to.be.revertedWith('Nanopay: stale nonce');
  });

  it('lets the payer sweep unspent funds after cooldown', async () => {
    const channelId = await openChannel(10n * 10n ** 6n);

    // Payee claims half.
    const totalSpent = 5n * 10n ** 6n;
    const nonce = 1n;
    const sig = await payer.signTypedData(domain, types, {
      channelId,
      payer: payer.address,
      payee: payee.address,
      totalSpent,
      nonce,
    });
    await nano.connect(payee).claim(channelId, totalSpent, nonce, sig);

    // Payer closes + advances time past cooldown.
    await nano.connect(payer).closeChannel(channelId);
    await ethers.provider.send('evm_increaseTime', [3600 + 1]);
    await ethers.provider.send('evm_mine', []);

    const balBefore = await usdc.balanceOf(payer.address);
    await nano.connect(payer).sweep(channelId);
    const balAfter = await usdc.balanceOf(payer.address);
    expect(balAfter - balBefore).to.equal(5n * 10n ** 6n); // refund half
  });

  it('blocks sweep before cooldown elapses', async () => {
    const channelId = await openChannel(10n * 10n ** 6n);
    await nano.connect(payer).closeChannel(channelId);
    await expect(nano.connect(payer).sweep(channelId)).to.be.revertedWith(
      'Nanopay: cooldown'
    );
  });
});
