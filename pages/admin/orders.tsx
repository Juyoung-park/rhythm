import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { handleLogout } from "../../lib/auth";
import Link from "next/link";
import { useRouter } from "next/router";

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
  customerId: string;
  customerEmail: string;
}

export default function AdminOrdersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 관리자 권한 확인
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.email !== "admin@rhythm.com") {
      router.push("/");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.email === "admin@rhythm.com") {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setError(null);
      console.log("Fetching all orders from Firebase...");
      
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} orders`);
      
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersData);
      console.log("Orders loaded successfully:", ordersData);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "주문 내역을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // 로컬 상태 업데이트
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      alert("주문 상태 업데이트 중 오류가 발생했습니다.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("이 주문을 취소하시겠습니까?")) {
      return;
    }
    
    try {
      setUpdatingOrder(orderId);
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
      console.log(`Order ${orderId} cancelled`);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      alert("주문 취소 중 오류가 발생했습니다.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("이 주문을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    try {
      setUpdatingOrder(orderId);
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);
      
      // 로컬 상태에서 제거
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      
      alert("주문이 삭제되었습니다.");
      console.log(`Order ${orderId} deleted`);
    } catch (error: any) {
      console.error("Error deleting order:", error);
      alert("주문 삭제 중 오류가 발생했습니다.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "대기중";
      case "confirmed": return "확정됨";
      case "in_production": return "제작중";
      case "shipped": return "배송중";
      case "delivered": return "배송완료";
      case "cancelled": return "취소됨";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "in_production": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const statusOptions = [
    { value: "pending", label: "대기중" },
    { value: "confirmed", label: "확정됨" },
    { value: "in_production", label: "제작중" },
    { value: "shipped", label: "배송중" },
    { value: "delivered", label: "배송완료" },
    { value: "cancelled", label: "취소됨" }
  ];

  if (!user || user.email !== "admin@rhythm.com") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <Link href="/products" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">주문 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/products" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Rhythm</Link>
              <span className="ml-2 text-gray-500">Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                관리자 홈
              </Link>
              <Link href="/admin/add-product" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                제품 추가
              </Link>
              <Link href="/my-info" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                내 정보
              </Link>
              <button
                onClick={() => handleLogout(router)}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
            관리자 페이지
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">주문 관리</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">전체 주문 내역을 확인하고 주문 상태를 관리하세요</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-lg">
            총 <span className="font-bold text-purple-600">{orders.length}</span>개의 주문이 있습니다
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">주문이 없습니다</h3>
            <p className="text-gray-600">아직 주문이 들어오지 않았습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{order.productName}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>주문번호: {order.id.slice(-8)} | 고객: {order.customerEmail}</div>
                      <div>사이즈: {order.selectedSize} | 색상: {order.selectedColor} | 수량: {order.quantity || 1}개</div>
                      <div>주문일: {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</div>
                      <div>배송지: {order.deliveryAddress}</div>
                      <div>연락처: {order.phoneNumber}</div>
                      {order.specialRequests && (
                        <div className="text-purple-600">특별 요청: {order.specialRequests}</div>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col items-end space-y-3">
                    {/* Current Status */}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    
                    {/* Status Update */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-medium text-gray-700">상태 변경:</label>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrder === order.id}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {updatingOrder === order.id && (
                        <div className="text-xs text-gray-500">업데이트 중...</div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      {order.status !== "cancelled" && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={updatingOrder === order.id}
                          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          취소
                        </button>
                      )}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        disabled={updatingOrder === order.id}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 