/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config();

import { testE2E } from '../../../tests/utils-e2e';
import {
  Tokens,
  Holders,
  NativeTokenSymbols,
} from '../../../tests/constants-e2e';
import { Network, ContractMethod, SwapSide } from '../../constants';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { generateConfig } from '../../config';
import { TransferFeeParams } from '../../types';

/*
  README
  ======

  This test script should add e2e tests for Algebra. The tests
  should cover as many cases as possible. Most of the DEXes follow
  the following test structure:
    - DexName
      - ForkName + Network
        - ContractMethod
          - ETH -> Token swap
          - Token -> ETH swap
          - Token -> Token swap

  The template already enumerates the basic structure which involves
  testing simpleSwap, multiSwap, megaSwap contract methods for
  ETH <> TOKEN and TOKEN <> TOKEN swaps. You should replace tokenA and
  tokenB with any two highly liquid tokens on Algebra for the tests
  to work. If the tokens that you would like to use are not defined in
  Tokens or Holders map, you can update the './tests/constants-e2e'

  Other than the standard cases that are already added by the template
  it is highly recommended to add test cases which could be specific
  to testing Algebra (Eg. Tests based on poolType, special tokens,
  etc).

  You can run this individual test script by running:
  `npx jest src/dex/<dex-name>/<dex-name>-e2e.test.ts`

  e2e tests use the Tenderly fork api. Please add the following to your
  .env file:
  TENDERLY_TOKEN=Find this under Account>Settings>Authorization.
  TENDERLY_ACCOUNT_ID=Your Tenderly account name.
  TENDERLY_PROJECT=Name of a Tenderly project you have created in your
  dashboard.

  (This comment should be removed from the final implementation)
*/

function testForNetwork(
  network: Network,
  dexKey: string,
  tokenASymbol: string,
  tokenBSymbol: string,
  tokenAAmount: string,
  tokenBAmount: string,
  nativeTokenAmount: string,
  transferFees: TransferFeeParams = {
    srcFee: 0,
    destFee: 0,
    srcDexFee: 0,
    destDexFee: 0,
  },
) {
  const provider = new StaticJsonRpcProvider(
    generateConfig(network).privateHttpProvider,
    network,
  );
  const tokens = Tokens[network];
  const holders = Holders[network];
  const nativeTokenSymbol = NativeTokenSymbols[network];

  // TODO: Add any direct swap contractMethod name if it exists
  const sideToContractMethods = new Map([
    [
      SwapSide.SELL,
      [
        ContractMethod.swapExactAmountIn,
        // ContractMethod.simpleSwap,
        // ContractMethod.multiSwap,
        // ContractMethod.megaSwap,
      ],
    ],
    // TODO: If buy is not supported remove the buy contract methods
    // [SwapSide.BUY, [ContractMethod.simpleBuy, ContractMethod.buy]],
    // [SwapSide.BUY, [ContractMethod.simpleBuy]],
  ]);

  describe(`${network}`, () => {
    sideToContractMethods.forEach((contractMethods, side) =>
      describe(`${side}`, () => {
        contractMethods.forEach((contractMethod: ContractMethod) => {
          describe(`${contractMethod}`, () => {
            // if src token is tax token and BUY side, then should fail (skip)
            if (!!transferFees?.srcDexFee && side === SwapSide.BUY) return;

            it(`${tokenASymbol} -> ${tokenBSymbol}`, async () => {
              await testE2E(
                tokens[tokenASymbol],
                tokens[tokenBSymbol],
                holders[tokenASymbol],
                side === SwapSide.SELL ? tokenAAmount : tokenBAmount,
                side,
                dexKey,
                contractMethod,
                network,
                provider,
                undefined,
                undefined,
                transferFees,
              );
            });
            it(`${tokenBSymbol} -> ${tokenASymbol}`, async () => {
              await testE2E(
                tokens[tokenBSymbol],
                tokens[tokenASymbol],
                holders[tokenBSymbol],
                side === SwapSide.SELL ? tokenBAmount : tokenAAmount,
                side,
                dexKey,
                contractMethod,
                network,
                provider,
                undefined,
                undefined,
                // switch src and dest fee when tax token is dest token
                {
                  ...transferFees,
                  srcDexFee: transferFees.destDexFee,
                  destDexFee: transferFees.srcDexFee,
                },
              );
            });
            it(`${nativeTokenSymbol} -> ${tokenASymbol}`, async () => {
              await testE2E(
                tokens[nativeTokenSymbol],
                tokens[tokenASymbol],
                holders[nativeTokenSymbol],
                side === SwapSide.SELL ? nativeTokenAmount : tokenAAmount,
                side,
                dexKey,
                contractMethod,
                network,
                provider,
                undefined,
                undefined,
                // switch src and dest fee when tax token is dest token
                {
                  ...transferFees,
                  srcDexFee: transferFees.destDexFee,
                  destDexFee: transferFees.srcDexFee,
                },
              );
            });
            it(`${tokenASymbol} -> ${nativeTokenSymbol}`, async () => {
              await testE2E(
                tokens[tokenASymbol],
                tokens[nativeTokenSymbol],
                holders[tokenASymbol],
                side === SwapSide.SELL ? tokenAAmount : nativeTokenAmount,
                side,
                dexKey,
                contractMethod,
                network,
                provider,
                undefined,
                undefined,
                transferFees,
              );
            });
          });
        });
      }),
    );
  });
}

describe('Algebra', () => {
  describe('QuickSwapV3 E2E', () => {
    const dexKey = 'QuickSwapV3';

    describe('Polygon_V6', () => {
      const network = Network.POLYGON;
      const tokenASymbol: string = 'USDC';
      const tokenBSymbol: string = 'DAI';

      const tokenAAmount: string = '1000000000';
      const tokenBAmount: string = '1000000000000000000000';
      const nativeTokenAmount = '1000000000000000000';

      testForNetwork(
        network,
        dexKey,
        tokenASymbol,
        tokenBSymbol,
        tokenAAmount,
        tokenBAmount,
        nativeTokenAmount,
      );
    });
  });

  describe('ZyberSwapV3', () => {
    const dexKey = 'ZyberSwapV3';

    describe('Arbitrum', () => {
      const network = Network.ARBITRUM;
      const tokenASymbol: string = 'USDC';
      const tokenBSymbol: string = 'DAI';

      const tokenAAmount: string = '1000000000';
      const tokenBAmount: string = '1000000000000000000000';
      const nativeTokenAmount = '1000000000000000000';

      testForNetwork(
        network,
        dexKey,
        tokenASymbol,
        tokenBSymbol,
        tokenAAmount,
        tokenBAmount,
        nativeTokenAmount,
      );
    });

    describe('Optimism', () => {
      const network = Network.OPTIMISM;
      const tokenASymbol: string = 'USDC';
      const tokenBSymbol: string = 'USDT';

      const tokenAAmount: string = '100000000';
      const tokenBAmount: string = '50000';
      const nativeTokenAmount = '100000000000000';

      testForNetwork(
        network,
        dexKey,
        tokenASymbol,
        tokenBSymbol,
        tokenAAmount,
        tokenBAmount,
        nativeTokenAmount,
      );
    });
  });

  describe('CamelotV3', () => {
    const dexKey = 'CamelotV3';
    const network = Network.ARBITRUM;

    describe('Arbitrum: Tax Tokens', () => {
      const tokenASymbol: string = 'RDPX';
      const tokenBSymbol: string = 'WETH';

      const tokenAAmount: string = '100000000000000000000';
      const tokenBAmount: string = '100000000000000000';
      const nativeTokenAmount = '1000000000000000000';

      testForNetwork(
        network,
        dexKey,
        tokenASymbol,
        tokenBSymbol,
        tokenAAmount,
        tokenBAmount,
        nativeTokenAmount,
        {
          srcFee: 0,
          destFee: 0,
          srcDexFee: 1000,
          destDexFee: 0,
        },
      );
    });

    describe('Arbitrum: Non-Tax tokens', () => {
      const tokenASymbol: string = 'USDCe';
      const tokenBSymbol: string = 'USDT';

      const tokenAAmount: string = '1000000000';
      const tokenBAmount: string = '1000000000';
      const nativeTokenAmount = '1000000000000000000';

      testForNetwork(
        network,
        dexKey,
        tokenASymbol,
        tokenBSymbol,
        tokenAAmount,
        tokenBAmount,
        nativeTokenAmount,
      );
    });
  });
});
