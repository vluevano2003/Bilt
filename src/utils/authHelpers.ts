import i18n from "../config/i18n";

export const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return i18n.t("errors.invalidEmail");
    case "auth/user-not-found":
      return i18n.t("errors.userNotFound");
    case "auth/wrong-password":
      return i18n.t("errors.wrongPassword");
    case "auth/email-already-in-use":
      return i18n.t("errors.emailInUse");
    case "auth/weak-password":
      return i18n.t("errors.weakPassword");
    case "auth/network-request-failed":
      return i18n.t("errors.networkFailed");
    case "auth/too-many-requests":
      return i18n.t("errors.tooManyRequests");
    default:
      return i18n.t("errors.unexpected");
  }
};

export const isValidEmail = (emailString: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(emailString.trim());
};
