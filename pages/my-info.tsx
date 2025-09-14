// src/pages/my-info.tsx

import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { handleLogout } from "../lib/auth";
import { useRouter } from "next/router";
import Link from "next/link";

interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  organization?: string;
  address?: string;
  carNumber?: string;
  size?: string;
  shoulderWidth?: number;
  waistCircumference?: number;
  bustCircumference?: number;
  hipCircumference?: number;
  sleeveLength?: number;
  thighCircumference?: number;
  topLength?: number;
  crotchLength?: number;
  skirtLength?: number;
  pantsLength?: number;
  height?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  createdAt: any;
  updatedAt: any;
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
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    organization: "",
    address: "",
    carNumber: "",
    size: "",
    shoulderWidth: "",
    waistCircumference: "",
    bustCircumference: "",
    hipCircumference: "",
    sleeveLength: "",
    thighCircumference: "",
    topLength: "",
    crotchLength: "",
    skirtLength: "",
    pantsLength: "",
    height: "",
    bust: "",
    waist: "",
    hip: ""
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
        const fullUserInfo: CustomerInfo = {
          id: userDoc.id,
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          organization: userData.organization || "",
          address: userData.address || "",
          carNumber: userData.carNumber || "",
          size: userData.size || "",
          shoulderWidth: userData.shoulderWidth || 0,
          waistCircumference: userData.waistCircumference || 0,
          bustCircumference: userData.bustCircumference || 0,
          hipCircumference: userData.hipCircumference || 0,
          sleeveLength: userData.sleeveLength || 0,
          thighCircumference: userData.thighCircumference || 0,
          topLength: userData.topLength || 0,
          crotchLength: userData.crotchLength || 0,
          skirtLength: userData.skirtLength || 0,
          pantsLength: userData.pantsLength || 0,
          height: userData.height || 0,
          bust: userData.bust || 0,
          waist: userData.waist || 0,
          hip: userData.hip || 0,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        setInfo(fullUserInfo);
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

  const handleEditClick = () => {
    if (info) {
      setEditForm({
        name: info.name || "",
        phone: info.phone || "",
        email: info.email || "",
        organization: info.organization || "",
        address: info.address || "",
        carNumber: info.carNumber || "",
        size: info.size || "",
        shoulderWidth: info.shoulderWidth?.toString() || "",
        waistCircumference: info.waistCircumference?.toString() || "",
        bustCircumference: info.bustCircumference?.toString() || "",
        hipCircumference: info.hipCircumference?.toString() || "",
        sleeveLength: info.sleeveLength?.toString() || "",
        thighCircumference: info.thighCircumference?.toString() || "",
        topLength: info.topLength?.toString() || "",
        crotchLength: info.crotchLength?.toString() || "",
        skirtLength: info.skirtLength?.toString() || "",
        pantsLength: info.pantsLength?.toString() || "",
        height: info.height?.toString() || "",
        bust: info.bust?.toString() || "",
        waist: info.waist?.toString() || "",
        hip: info.hip?.toString() || ""
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: "",
      phone: "",
      email: "",
      organization: "",
      address: "",
      carNumber: "",
      size: "",
      shoulderWidth: "",
      waistCircumference: "",
      bustCircumference: "",
      hipCircumference: "",
      sleeveLength: "",
      thighCircumference: "",
      topLength: "",
      crotchLength: "",
      skirtLength: "",
      pantsLength: "",
      height: "",
      bust: "",
      waist: "",
      hip: ""
    });
  };

  const handleSaveEdit = async () => {
    if (!info || !user) return;

    setLoading(true);
    try {
      const updateData: any = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        organization: editForm.organization,
        address: editForm.address,
        carNumber: editForm.carNumber,
        size: editForm.size,
        updatedAt: new Date()
      };

      // 숫자 필드들은 값이 있을 때만 추가
      const numericFields = [
        'shoulderWidth',
        'waistCircumference', 
        'bustCircumference',
        'hipCircumference',
        'sleeveLength',
        'thighCircumference',
        'topLength',
        'crotchLength',
        'skirtLength',
        'pantsLength',
        'height',
        'bust',
        'waist',
        'hip'
      ];

      numericFields.forEach(field => {
        const value = editForm[field as keyof typeof editForm];
        if (value && typeof value === 'string' && value.trim()) {
          const numValue = Number(value.trim());
          if (!isNaN(numValue)) {
            updateData[field] = numValue;
          }
        }
      });

      await updateDoc(doc(db, "users", user.uid), updateData);
      
      // 정보 새로고침
      await fetchUserInfo();
      setIsEditing(false);
      alert("정보가 성공적으로 업데이트되었습니다!");
    } catch (error) {
      console.error("Error updating user info:", error);
      alert("정보 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("이 주문을 취소하시겠습니까?")) {
      return;
    }
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "cancelled",
        updatedAt: new Date()
      });
      
      // 로컬 상태 업데이트
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: "cancelled" }
            : order
        )
      );
      
      alert("주문이 취소되었습니다.");
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      alert("주문 취소 중 오류가 발생했습니다.");
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("이 주문을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);
      
      // 로컬 상태에서 제거
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      
      alert("주문이 삭제되었습니다.");
    } catch (error: any) {
      console.error("Error deleting order:", error);
      alert("주문 삭제 중 오류가 발생했습니다.");
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
              {user && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">
                      안녕하세요, <span className="font-medium text-purple-600">{info.name || user.email}</span>님
                    </div>
                  </div>
                  <button
                    onClick={() => handleLogout(router)}
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              )}
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
          {activeTab === "info" && info && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">개인 정보</h2>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    수정
                  </button>
                )}
              </div>

              {!isEditing ? (
                // 보기 모드
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.name || "-"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.phone || "-"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.email || "-"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">소속</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.organization || "-"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.address || "-"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">차량번호</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.carNumber || "-"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">사이즈</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{info.size || "-"}</div>
                    </div>
                  </div>

                  {/* 신체 치수 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">신체 치수</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: 'height', label: '키 (cm)' },
                        { key: 'bust', label: '가슴 둘레 (cm)' },
                        { key: 'waist', label: '허리 둘레 (cm)' },
                        { key: 'hip', label: '힙 둘레 (cm)' },
                        { key: 'shoulderWidth', label: '어깨 너비 (cm)' },
                        { key: 'waistCircumference', label: '허리 둘레 (cm)' },
                        { key: 'bustCircumference', label: '가슴 둘레 (cm)' },
                        { key: 'hipCircumference', label: '힙 둘레 (cm)' },
                        { key: 'sleeveLength', label: '소매 길이 (cm)' },
                        { key: 'thighCircumference', label: '허벌지 둘레 (cm)' },
                        { key: 'topLength', label: '상의 길이 (cm)' },
                        { key: 'crotchLength', label: '밑위 길이 (cm)' },
                        { key: 'skirtLength', label: '치마 길이 (cm)' },
                        { key: 'pantsLength', label: '바지 길이 (cm)' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            {info[key as keyof CustomerInfo] || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // 수정 모드
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">소속</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.organization}
                        onChange={(e) => setEditForm({...editForm, organization: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.address}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">차량번호</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.carNumber}
                        onChange={(e) => setEditForm({...editForm, carNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">사이즈</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editForm.size}
                        onChange={(e) => setEditForm({...editForm, size: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* 신체 치수 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">신체 치수 (선택사항)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: 'height', label: '키 (cm)' },
                        { key: 'bust', label: '가슴 둘레 (cm)' },
                        { key: 'waist', label: '허리 둘레 (cm)' },
                        { key: 'hip', label: '힙 둘레 (cm)' },
                        { key: 'shoulderWidth', label: '어깨 너비 (cm)' },
                        { key: 'waistCircumference', label: '허리 둘레 (cm)' },
                        { key: 'bustCircumference', label: '가슴 둘레 (cm)' },
                        { key: 'hipCircumference', label: '힙 둘레 (cm)' },
                        { key: 'sleeveLength', label: '소매 길이 (cm)' },
                        { key: 'thighCircumference', label: '허벌지 둘레 (cm)' },
                        { key: 'topLength', label: '상의 길이 (cm)' },
                        { key: 'crotchLength', label: '밑위 길이 (cm)' },
                        { key: 'skirtLength', label: '치마 길이 (cm)' },
                        { key: 'pantsLength', label: '바지 길이 (cm)' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                          <input
                            type="number"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={editForm[key as keyof typeof editForm]}
                            onChange={(e) => setEditForm({...editForm, [key]: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading || !editForm.name.trim() || !editForm.phone.trim()}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "저장 중..." : "저장"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
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
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <div>
                                  <span className="text-gray-500 text-xs">사이즈</span>
                                  <div className="font-medium text-gray-900">{order.selectedSize}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                                <div>
                                  <span className="text-gray-500 text-xs">색상</span>
                                  <div className="font-medium text-gray-900">{order.selectedColor}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                <div>
                                  <span className="text-gray-500 text-xs">수량</span>
                                  <div className="font-medium text-purple-600">{order.quantity || 1}개</div>
                                </div>
                              </div>
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
                          {(order.status === "pending" || order.status === "processing") && (
                            <div className="flex flex-col space-y-1 mt-2">
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          )}
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
