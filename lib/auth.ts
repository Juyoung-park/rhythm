import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/router";

export const handleLogout = async (router: any) => {
  try {
    await signOut(auth);
    alert("로그아웃되었습니다.");
    router.push("/");
  } catch (error) {
    console.error("로그아웃 오류:", error);
    alert("로그아웃 중 오류가 발생했습니다.");
  }
};
