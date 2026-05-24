import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getNickname } from "../utils/user";

export const saveScore = async (
  userId: string,
  level: number,
  characterId: string
) => {
  await setDoc(doc(db, "scores", userId), {
    userId,
    nickname: getNickname(),
    level,
    characterId,
    updatedAt: serverTimestamp()
  });
};
