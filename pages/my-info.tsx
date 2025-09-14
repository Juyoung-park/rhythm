// src/pages/my-info.tsx

import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
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
  quantity: number;
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
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">주문 내역</h2>
                <div className="text-sm text-gray-500">
                  총 {orders.length}건의 주문
                </div>
              </div>

              {/* 주문 상태 필터 */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 w-fit">
                  {["all", "pending", "processing", "completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        orderStatusFilter === status
                          ? "bg-white text-purple-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {status === "all" ? "전체" : getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

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
                  {orders
                    .filter(order => orderStatusFilter === "all" || order.status === orderStatusFilter)
                    .map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-2">{order.productName}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="font-medium">{order.selectedSize}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                              </svg>
                              <span className="font-medium">{order.selectedColor}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              <span className="font-medium">수량: {order.quantity || 1}개</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            주문번호: {order.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>주문일: {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>배송지: {order.deliveryAddress}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>연락처: {order.phoneNumber}</span>
                          </div>
                          {order.specialRequests && (
                            <div className="flex items-start text-gray-600">
                              <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>특별 요청: {order.specialRequests}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 주문 상태별 추가 정보 */}
                      {order.status === "processing" && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center text-blue-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">제작 진행 중입니다. 완료 시 연락드리겠습니다.</span>
                          </div>
                        </div>
                      )}
                      
                      {order.status === "completed" && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center text-green-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">제작이 완료되었습니다. 배송 준비 중입니다.</span>
                          </div>
                        </div>
                      )}
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
