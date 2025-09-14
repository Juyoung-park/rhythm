import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, addDoc, where } from "firebase/firestore";
import Link from "next/link";
import dynamic from "next/dynamic";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  sizes: string[];
  colors: string[];
  createdAt: any;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  organization?: string; // 소속
  address?: string; // 주소
  carNumber?: string; // 차량번호
  size?: string; // 사이즈
  shoulderWidth?: number; // 어깨너비
  waistCircumference?: number; // 허리둘레
  bustCircumference?: number; // 가슴둘레
  hipCircumference?: number; // 엉덩이둘레
  sleeveLength?: number; // 소매길이
  thighCircumference?: number; // 허벌지둘레
  topLength?: number; // 상의길이
  crotchLength?: number; // 밑위길이
  skirtLength?: number; // 치마길이
  pantsLength?: number; // 바지길이
  email: string;
  updatedAt: any;
}

interface Order {
  id: string;
  customerId: string;
  productId: string;
  customerName: string;
  productName: string;
  status: string;
  createdAt: any;
}

// Force client-side rendering
const AdminPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
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
    email: ""
  });

  // Wait for router to be ready
  if (!router.isReady) {
    return <div className="p-4">로딩 중...</div>;
  }

  useEffect(() => {
    if (user === undefined) return;
    
    if (!user || user.email !== "admin@rhythm.com") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      // Fetch products
      const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Fetch customers (users)
      const usersQuery = query(collection(db, "users"), orderBy("updatedAt", "desc"));
      const usersSnapshot = await getDocs(usersQuery);
      const customersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      console.log("Firestore에서 가져온 사용자 수:", customersData.length);
      console.log("사용자 목록:", customersData.map(u => ({ email: u.email, name: u.name })));

      // Fetch orders
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const customerOrdersQuery = query(
        collection(db, "orders"),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc")
      );
      const ordersSnapshot = await getDocs(customerOrdersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setCustomerOrders(ordersData);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      setCustomerOrders([]);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("정말로 이 제품을 삭제하시겠습니까?")) return;
    
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(products.filter(p => p.id !== productId));
      alert("제품이 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      alert("주문 상태가 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      phone: customer.phone || "",
      organization: customer.organization || "",
      address: customer.address || "",
      carNumber: customer.carNumber || "",
      size: customer.size || "",
      shoulderWidth: customer.shoulderWidth?.toString() || "",
      waistCircumference: customer.waistCircumference?.toString() || "",
      bustCircumference: customer.bustCircumference?.toString() || "",
      hipCircumference: customer.hipCircumference?.toString() || "",
      sleeveLength: customer.sleeveLength?.toString() || "",
      thighCircumference: customer.thighCircumference?.toString() || "",
      topLength: customer.topLength?.toString() || "",
      crotchLength: customer.crotchLength?.toString() || "",
      skirtLength: customer.skirtLength?.toString() || "",
      pantsLength: customer.pantsLength?.toString() || "",
      email: customer.email || ""
    });
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      await updateDoc(doc(db, "users", editingCustomer.id), {
        name: editForm.name,
        phone: editForm.phone,
        organization: editForm.organization,
        address: editForm.address,
        carNumber: editForm.carNumber,
        size: editForm.size,
        shoulderWidth: editForm.shoulderWidth ? Number(editForm.shoulderWidth) : undefined,
        waistCircumference: editForm.waistCircumference ? Number(editForm.waistCircumference) : undefined,
        bustCircumference: editForm.bustCircumference ? Number(editForm.bustCircumference) : undefined,
        hipCircumference: editForm.hipCircumference ? Number(editForm.hipCircumference) : undefined,
        sleeveLength: editForm.sleeveLength ? Number(editForm.sleeveLength) : undefined,
        thighCircumference: editForm.thighCircumference ? Number(editForm.thighCircumference) : undefined,
        topLength: editForm.topLength ? Number(editForm.topLength) : undefined,
        crotchLength: editForm.crotchLength ? Number(editForm.crotchLength) : undefined,
        skirtLength: editForm.skirtLength ? Number(editForm.skirtLength) : undefined,
        pantsLength: editForm.pantsLength ? Number(editForm.pantsLength) : undefined,
        email: editForm.email,
        updatedAt: new Date()
      });

      setCustomers(customers.map(customer => 
        customer.id === editingCustomer.id 
          ? { 
              ...customer, 
              name: editForm.name,
              phone: editForm.phone,
              organization: editForm.organization,
              address: editForm.address,
              carNumber: editForm.carNumber,
              size: editForm.size,
              shoulderWidth: editForm.shoulderWidth ? Number(editForm.shoulderWidth) : undefined,
              waistCircumference: editForm.waistCircumference ? Number(editForm.waistCircumference) : undefined,
              bustCircumference: editForm.bustCircumference ? Number(editForm.bustCircumference) : undefined,
              hipCircumference: editForm.hipCircumference ? Number(editForm.hipCircumference) : undefined,
              sleeveLength: editForm.sleeveLength ? Number(editForm.sleeveLength) : undefined,
              thighCircumference: editForm.thighCircumference ? Number(editForm.thighCircumference) : undefined,
              topLength: editForm.topLength ? Number(editForm.topLength) : undefined,
              crotchLength: editForm.crotchLength ? Number(editForm.crotchLength) : undefined,
              skirtLength: editForm.skirtLength ? Number(editForm.skirtLength) : undefined,
              pantsLength: editForm.pantsLength ? Number(editForm.pantsLength) : undefined,
              email: editForm.email,
              updatedAt: new Date()
            }
          : customer
      ));

      setEditingCustomer(null);
      alert("고객 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("정말로 이 고객을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    
    try {
      await deleteDoc(doc(db, "users", customerId));
      setCustomers(customers.filter(c => c.id !== customerId));
      alert("고객이 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAddCustomer = async () => {
    // 필수 필드 검증
    if (!editForm.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!editForm.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    try {
      console.log("=== 고객 추가 시작 ===");
      console.log("입력된 폼 데이터:", editForm);
      
      const newCustomerData = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || "",
        organization: editForm.organization.trim() || "",
        address: editForm.address.trim() || "",
        carNumber: editForm.carNumber.trim() || "",
        size: editForm.size.trim() || "",
        shoulderWidth: editForm.shoulderWidth ? Number(editForm.shoulderWidth) : undefined,
        waistCircumference: editForm.waistCircumference ? Number(editForm.waistCircumference) : undefined,
        bustCircumference: editForm.bustCircumference ? Number(editForm.bustCircumference) : undefined,
        hipCircumference: editForm.hipCircumference ? Number(editForm.hipCircumference) : undefined,
        sleeveLength: editForm.sleeveLength ? Number(editForm.sleeveLength) : undefined,
        thighCircumference: editForm.thighCircumference ? Number(editForm.thighCircumference) : undefined,
        topLength: editForm.topLength ? Number(editForm.topLength) : undefined,
        crotchLength: editForm.crotchLength ? Number(editForm.crotchLength) : undefined,
        skirtLength: editForm.skirtLength ? Number(editForm.skirtLength) : undefined,
        pantsLength: editForm.pantsLength ? Number(editForm.pantsLength) : undefined,
        updatedAt: new Date()
      };

      console.log("처리된 고객 데이터:", newCustomerData);
      console.log("Firestore DB 객체:", db);
      
      const docRef = await addDoc(collection(db, "users"), newCustomerData);
      console.log("Firestore 문서 참조:", docRef);
      
      const newCustomer: Customer = {
        id: docRef.id,
        ...newCustomerData
      };

      console.log("새 고객 객체:", newCustomer);
      
      setCustomers([newCustomer, ...customers]);
      setShowAddCustomer(false);
      resetForm();
      alert("고객이 성공적으로 추가되었습니다.");
      console.log("=== 고객 추가 완료 ===");
    } catch (error) {
      console.error("=== 고객 추가 에러 ===");
      console.error("에러 타입:", typeof error);
      console.error("에러 객체:", error);
      console.error("에러 메시지:", error instanceof Error ? error.message : String(error));
      console.error("에러 코드:", (error as any)?.code);
      console.error("에러 스택:", error instanceof Error ? error.stack : "No stack trace");
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`고객 추가 중 오류가 발생했습니다.\n\n오류: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
    }
  };

  const resetForm = () => {
    setEditForm({
      name: "",
      phone: "",
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
      email: ""
    });
  };

  const handleViewCustomerOrders = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerOrders(true);
    await fetchCustomerOrders(customer.id);
  };

  const closeCustomerOrders = () => {
    setSelectedCustomer(null);
    setShowCustomerOrders(false);
    setCustomerOrders([]);
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setShowAddCustomer(false);
    resetForm();
  };

  // 고객 검색 필터링
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.organization && customer.organization.toLowerCase().includes(searchLower)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower)) ||
      (customer.carNumber && customer.carNumber.toLowerCase().includes(searchLower)) ||
      (customer.size && customer.size.toLowerCase().includes(searchLower))
    );
  });

  if (user === undefined) {
    return <div className="p-4">로딩 중...</div>;
  }

  if (!user || user.email !== "admin@rhythm.com") {
    return <div className="p-4">관리자 권한이 필요합니다.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-600">Rhythm</Link>
              <span className="ml-2 text-gray-600">관리자</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                홈으로
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                제품보기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">관리자 패널</h1>
          <p className="text-gray-600">제품, 고객, 주문을 관리하세요</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white rounded-lg shadow p-1">
            {[
              { id: "products", name: "제품 관리", count: products.length },
              { id: "customers", name: "고객 관리", count: customers.length },
              { id: "orders", name: "주문 관리", count: orders.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-700 hover:text-purple-600"
                }`}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-4">
            <Link
              href="/admin/add-product"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              새 제품 추가
            </Link>
            <Link
              href="/admin/orders"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              주문 상세 관리
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === "products" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">제품 관리</h2>
                <div className="flex space-x-2">
                  <Link
                    href="/admin/add-test-product"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    테스트 제품 추가
                  </Link>
                  <Link
                    href="/admin/add-product"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    새 제품 추가
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₩{product.price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">고객 관리</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAddCustomer(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    고객 추가
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="고객 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    총 {customers.length}명 | 검색 결과 {filteredCustomers.length}명
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소속</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : "등록된 고객이 없습니다."}
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 max-w-32 truncate">{customer.email || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{customer.phone || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 max-w-24 truncate">{customer.organization || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.updatedAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleViewCustomerOrders(customer)}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              주문내역
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">주문 관리</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "processing" ? "bg-blue-100 text-blue-800" :
                            order.status === "completed" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status === "pending" ? "대기중" :
                             order.status === "processing" ? "제작중" :
                             order.status === "completed" ? "완료" : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="pending">대기중</option>
                            <option value="processing">제작중</option>
                            <option value="completed">완료</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 고객 수정 모달 */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">고객 정보 수정</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">기본 정보</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                    <input
                      type="text"
                      value={editForm.organization}
                      onChange={(e) => setEditForm({...editForm, organization: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">차량번호</label>
                    <input
                      type="text"
                      value={editForm.carNumber}
                      onChange={(e) => setEditForm({...editForm, carNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사이즈</label>
                    <input
                      type="text"
                      value={editForm.size}
                      onChange={(e) => setEditForm({...editForm, size: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* 신체 치수 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">신체 치수 (cm)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">어깨너비</label>
                      <input
                        type="number"
                        value={editForm.shoulderWidth}
                        onChange={(e) => setEditForm({...editForm, shoulderWidth: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허리둘레</label>
                      <input
                        type="number"
                        value={editForm.waistCircumference}
                        onChange={(e) => setEditForm({...editForm, waistCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">가슴둘레</label>
                      <input
                        type="number"
                        value={editForm.bustCircumference}
                        onChange={(e) => setEditForm({...editForm, bustCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">엉덩이둘레</label>
                      <input
                        type="number"
                        value={editForm.hipCircumference}
                        onChange={(e) => setEditForm({...editForm, hipCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">소매길이</label>
                      <input
                        type="number"
                        value={editForm.sleeveLength}
                        onChange={(e) => setEditForm({...editForm, sleeveLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허벌지둘레</label>
                      <input
                        type="number"
                        value={editForm.thighCircumference}
                        onChange={(e) => setEditForm({...editForm, thighCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상의길이</label>
                      <input
                        type="number"
                        value={editForm.topLength}
                        onChange={(e) => setEditForm({...editForm, topLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">밑위길이</label>
                      <input
                        type="number"
                        value={editForm.crotchLength}
                        onChange={(e) => setEditForm({...editForm, crotchLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">치마길이</label>
                      <input
                        type="number"
                        value={editForm.skirtLength}
                        onChange={(e) => setEditForm({...editForm, skirtLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">바지길이</label>
                      <input
                        type="number"
                        value={editForm.pantsLength}
                        onChange={(e) => setEditForm({...editForm, pantsLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 고객 추가 모달 */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">새 고객 추가</h3>
              <p className="text-sm text-gray-600 mt-1">* 표시된 필드는 필수 입력 항목입니다.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">기본 정보</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                    <input
                      type="text"
                      value={editForm.organization}
                      onChange={(e) => setEditForm({...editForm, organization: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">차량번호</label>
                    <input
                      type="text"
                      value={editForm.carNumber}
                      onChange={(e) => setEditForm({...editForm, carNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사이즈</label>
                    <input
                      type="text"
                      value={editForm.size}
                      onChange={(e) => setEditForm({...editForm, size: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* 신체 치수 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">신체 치수 (cm)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">어깨너비</label>
                      <input
                        type="number"
                        value={editForm.shoulderWidth}
                        onChange={(e) => setEditForm({...editForm, shoulderWidth: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허리둘레</label>
                      <input
                        type="number"
                        value={editForm.waistCircumference}
                        onChange={(e) => setEditForm({...editForm, waistCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">가슴둘레</label>
                      <input
                        type="number"
                        value={editForm.bustCircumference}
                        onChange={(e) => setEditForm({...editForm, bustCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">엉덩이둘레</label>
                      <input
                        type="number"
                        value={editForm.hipCircumference}
                        onChange={(e) => setEditForm({...editForm, hipCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">소매길이</label>
                      <input
                        type="number"
                        value={editForm.sleeveLength}
                        onChange={(e) => setEditForm({...editForm, sleeveLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허벌지둘레</label>
                      <input
                        type="number"
                        value={editForm.thighCircumference}
                        onChange={(e) => setEditForm({...editForm, thighCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상의길이</label>
                      <input
                        type="number"
                        value={editForm.topLength}
                        onChange={(e) => setEditForm({...editForm, topLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">밑위길이</label>
                      <input
                        type="number"
                        value={editForm.crotchLength}
                        onChange={(e) => setEditForm({...editForm, crotchLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">치마길이</label>
                      <input
                        type="number"
                        value={editForm.skirtLength}
                        onChange={(e) => setEditForm({...editForm, skirtLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">바지길이</label>
                      <input
                        type="number"
                        value={editForm.pantsLength}
                        onChange={(e) => setEditForm({...editForm, pantsLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                고객 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원별 주문 히스토리 모달 */}
      {showCustomerOrders && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.name || selectedCustomer.email}의 주문 내역
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    총 {customerOrders.length}건의 주문
                  </p>
                </div>
                <button
                  onClick={closeCustomerOrders}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">주문 내역이 없습니다</h3>
                  <p className="text-gray-600">이 고객은 아직 주문을 하지 않았습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg mb-2">{order.productName}</h4>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">주문번호:</span> {order.id.slice(-8)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "processing" ? "bg-blue-100 text-blue-800" :
                            order.status === "completed" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status === "pending" ? "대기중" :
                             order.status === "processing" ? "제작중" :
                             order.status === "completed" ? "완료" : order.status}
                          </span>
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>제품: {order.productName}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>고객: {order.customerName}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>상태: {order.status === "pending" ? "대기중" : order.status === "processing" ? "제작중" : order.status === "completed" ? "완료" : order.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* 주문 상태별 추가 정보 */}
                      {order.status === "processing" && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center text-blue-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">제작 진행 중입니다.</span>
                          </div>
                        </div>
                      )}
                      
                      {order.status === "completed" && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center text-green-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">제작이 완료되었습니다.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={closeCustomerOrders}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export with dynamic import to ensure client-side rendering
export default dynamic(() => Promise.resolve(AdminPage), {
  ssr: false
}); 