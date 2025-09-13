// src/pages/my-info.tsx

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

interface CustomerInfo {
  name: string;
  phone: string;
  height: number;
  bust: number;
  waist: number;
  hip: number;
}

interface Order {
  id: string;
  productName: string;
  selectedSize: string;
  selectedColor: string;
  status: string;
  createdAt: any;
  deliveryAddress: string;
  phoneNumber: string;
  specialRequests?: string;
}

export default function MyInfoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [info, setInfo] = useState({
    name: "",
    phone: "",
    height: "",
    bust: "",
    waist: "",
    hip: "",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (user && user.uid) {
      fetchUserInfo();
      fetchOrders();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user!.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setInfo({
          name: userData.name || "",
          phone: userData.phone || "",
          height: userData.height?.toString() || "",
          bust: userData.bust?.toString() || "",
          waist: userData.waist?.toString() || "",
          hip: userData.hip?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      // 임시로 정렬 없이 쿼리 (인덱스 생성 전까지)
      const ordersQuery = query(
        collection(db, "orders"),
        where("customerId", "==", user!.uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // 클라이언트에서 정렬
      ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // 아직 Firebase가 user 정보를 가져오는 중 (초기 로딩 상태)
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 안 된 상태
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <Link href="/login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!user) return alert("로그인이 필요합니다.");

    setLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        ...info,
        height: Number(info.height),
        bust: Number(info.bust),
        waist: Number(info.waist),
        hip: Number(info.hip),
        updatedAt: new Date(),
      });

      alert("정보가 저장되었습니다!");
    } catch (err) {
      console.error(err);
      alert("저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "대기중";
      case "processing": return "제작중";
      case "completed": return "완료";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Rhythm</Link>
              <span className="ml-2 text-gray-500">내 정보</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                홈
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                제품보기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">내 정보</h1>
          <p className="text-gray-600">개인 정보와 주문 내역을 관리하세요</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "info"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              개인 정보
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "orders"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              주문 내역 ({orders.length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {activeTab === "info" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">개인 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["name", "phone", "height", "bust", "waist", "hip"].map((field) => (
                  <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
                      {field === "name" ? "이름" :
                       field === "phone" ? "연락처" :
                       field === "height" ? "키 (cm)" :
                       field === "bust" ? "가슴 둘레 (cm)" :
                       field === "waist" ? "허리 둘레 (cm)" : "힙 둘레 (cm)"}
                    </label>
                    <input
                      id={field}
                      name={field}
                      type={field === "height" || field === "bust" || field === "waist" || field === "hip" ? "number" : "text"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={field === "name" ? "이름을 입력하세요" :
                                 field === "phone" ? "연락처를 입력하세요" : "숫자를 입력하세요"}
                      value={info[field as keyof typeof info]}
                      onChange={handleChange}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  {loading ? "저장 중..." : "정보 저장"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">주문 내역</h2>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">주문 내역을 불러오는 중...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">주문 내역이 없습니다</h3>
                  <p className="text-gray-600 mb-4">첫 번째 주문을 해보세요!</p>
                  <Link href="/products" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                    제품 보기
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{order.productName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            사이즈: <span className="font-medium">{order.selectedSize}</span> | 색상: <span className="font-medium">{order.selectedColor}</span>
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div>주문일: {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</div>
                        <div>배송지: {order.deliveryAddress}</div>
                        <div>연락처: {order.phoneNumber}</div>
                        {order.specialRequests && (
                          <div>특별 요청: {order.specialRequests}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
