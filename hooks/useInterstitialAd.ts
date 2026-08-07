import { useEffect, useState } from "react";
import {
    AdEventType,
    InterstitialAd,
    TestIds,
} from "react-native-google-mobile-ads";

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_SAVE as string);

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

/**
 * Custom hook para manejar un anuncio intersticial de Google Mobile Ads.
 * Carga el anuncio al montar el componente y lo recarga cada vez que se cierra.
 * @returns
 */
export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true);
      },
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setLoaded(false);
        interstitial.load();
      },
    );

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const showAdIfLoaded = () => {
    if (loaded) {
      interstitial.show();
    } else {
      console.log(
        "El anuncio no cargó a tiempo, omitiendo para no frenar al usuario.",
      );
    }
  };

  return { isAdLoaded: loaded, showAdIfLoaded };
};
