import { Share } from "react-native";
import i18n from "../config/i18n";

const WEB_BRIDGE_URL = "https://vluevano2003.github.io/bilttracker-web";

export const shareProfile = async (profileId: string, username: string) => {
  const url = `${WEB_BRIDGE_URL}?type=userProfile&id=${profileId}`;
  try {
    await Share.share({
      message: i18n.t("share.profileMessage", { username, url }),
    });
  } catch (error) {
    console.log("Error compartiendo perfil", error);
  }
};
