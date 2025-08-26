"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserCheck,
  Calendar,
  Package,
  MessageSquare,
  Eye,
  Check,
  X,
  Clock,
  RefreshCw,
  Search,
  Filter,
  User,
  Stethoscope,
  ShoppingCart,
  Lightbulb,
} from "lucide-react"
import { toast } from "sonner"
import {
  getAllUsers,
  updateUserStatus,
  getAllConsultantApplications,
  updateConsultantApplicationStatus,
  getAllConsultationBookings,
  updateBookingStatus,
  getAllSupplierDevices,
  updateDeviceStatus,
  getAllFeedback,
  updateFeedbackStatus,
  getAllOrders,
  updateOrderStatus,
} from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, updateDoc, doc, Timestamp } from "firebase/firestore"

export default function AdminPanel() {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // State for all data
  const [users, setUsers] = useState([])
  const [consultantApplications, setConsultantApplications] = useState([])
  const [consultationBookings, setConsultationBookings] = useState([])
  const [supplierDevices, setSupplierDevices] = useState([])
  const [feedback, setFeedback] = useState([])
  const [orders, setOrders] = useState([])
  const [featureSuggestions, setFeatureSuggestions] = useState([])

  const [bookingFilterStatus, setBookingFilterStatus] = useState("all")
  const [bookingSearchTerm, setBookingSearchTerm] = useState("")
  const [filteredBookings, setFilteredBookings] = useState([])

  const getAllFeatureSuggestions = async () => {
    try {
      const q = query(collection(db, "featureSuggestions"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const suggestions = []
      querySnapshot.forEach((doc) => {
        suggestions.push({
          id: doc.id,
          ...doc.data(),
        })
      })
      return suggestions
    } catch (error) {
      console.error("Error fetching feature suggestions:", error)
      return []
    }
  }

  const handleFeatureSuggestionStatusUpdate = async (suggestionId, newStatus) => {
    try {
      console.log("[v0] Updating feature suggestion:", suggestionId, "to status:", newStatus)
      await updateDoc(doc(db, "featureSuggestions", suggestionId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      })

      // Update local state
      setFeatureSuggestions((prev) =>
        prev.map((suggestion) =>
          suggestion.id === suggestionId
            ? { ...suggestion, status: newStatus, updatedAt: Timestamp.now() }
            : suggestion,
        ),
      )

      console.log("[v0] Feature suggestion status updated successfully")
      toast.success(`Feature suggestion ${newStatus} successfully!`)
    } catch (error) {
      console.error("Error updating feature suggestion status:", error)
      toast.error("Failed to update feature suggestion status.")
    }
  }

  // Load all data
  const loadAllData = async () => {
    setLoading(true)
    try {
      const [usersData, consultantsData, bookingsData, devicesData, feedbackData, ordersData, suggestionsData] =
        await Promise.all([
          getAllUsers(),
          getAllConsultantApplications(),
          getAllConsultationBookings(),
          getAllSupplierDevices(),
          getAllFeedback(),
          getAllOrders(),
          getAllFeatureSuggestions(),
        ])

      setUsers(usersData)
      setConsultantApplications(consultantsData)
      setConsultationBookings(bookingsData)
      setSupplierDevices(devicesData)
      setFeedback(feedbackData)
      setOrders(ordersData)
      setFeatureSuggestions(suggestionsData)
    } catch (error) {
      toast.error("Failed to load data from Database.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterBookings()
  }, [consultationBookings, bookingFilterStatus, bookingSearchTerm])

  const filterBookings = () => {
    let filtered = consultationBookings

    if (bookingFilterStatus !== "all") {
      filtered = filtered.filter((booking) => booking.status === bookingFilterStatus)
    }

    if (bookingSearchTerm) {
      filtered = filtered.filter(
        (booking) =>
          (booking.clientName || booking.name || "").toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
          (booking.email || "").toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
          (booking.serviceType || booking.consultationType || "")
            .toLowerCase()
            .includes(bookingSearchTerm.toLowerCase()),
      )
    }

    setFilteredBookings(filtered)
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
    toast({
      title: "Success",
      description: "Data refreshed successfully!",
    })
  }

  const handleLogout = () => {
    // Clear any stored admin session data
    localStorage.removeItem("adminSession")
    // Trigger parent component to show login again
    window.location.reload()
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Status update handlers
  const handleUserStatusUpdate = async (userId, status) => {
    try {
      await updateUserStatus(userId, status)
      setUsers(users.map((user) => (user.id === userId ? { ...user, status } : user)))
      toast({
        title: "Success",
        description: `User ${status === "approved" ? "approved" : "rejected"} successfully!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      })
    }
  }

  const handleConsultantStatusUpdate = async (applicationId, status) => {
    try {
      await updateConsultantApplicationStatus(applicationId, status)
      setConsultantApplications(
        consultantApplications.map((app) => (app.id === applicationId ? { ...app, status } : app)),
      )
      toast({
        title: "Success",
        description: `Consultant application ${status} successfully!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update consultant application status.",
        variant: "destructive",
      })
    }
  }

  const handleBookingStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status)
      setConsultationBookings(
        consultationBookings.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)),
      )
      toast({
        title: "Success",
        description: `Booking ${status} successfully!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      })
    }
  }

  const handleDeviceStatusUpdate = async (device, status) => {
    try {
      await updateDeviceStatus(device, status)
      setSupplierDevices(supplierDevices.map((d) => (d.id === device.id ? { ...d, status } : d)))
      toast({
        title: "Success",
        description: `Device ${status === "approved" ? "approved" : "rejected"} successfully!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update device status.",
        variant: "destructive",
      })
    }
  }

  const handleFeedbackStatusUpdate = async (feedbackId, status) => {
    try {
      await updateFeedbackStatus(feedbackId, status)
      setFeedback(feedback.map((fb) => (fb.id === feedbackId ? { ...fb, status } : fb)))
      toast({
        title: "Success",
        description: `Feedback ${status === "approved" ? "approved" : "rejected"} successfully!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback status.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", icon: Clock },
      "not-approved": { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: Check },
      rejected: { variant: "destructive", icon: X },
      accepted: { variant: "default", icon: Check },
      processing: { variant: "secondary", icon: Clock },
      shipped: { variant: "default", icon: Check },
      delivered: { variant: "default", icon: Check },
      cancelled: { variant: "destructive", icon: X },
    }

    const config = statusConfig[status] || statusConfig["pending"]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status || "pending"}
      </Badge>
    )
  }

  const getBookingStats = () => {
    const total = consultationBookings.length
    const pending = consultationBookings.filter((b) => !b.status || b.status === "pending").length
    const accepted = consultationBookings.filter((b) => b.status === "accepted").length
    const rejected = consultationBookings.filter((b) => b.status === "rejected").length
    return { total, pending, accepted, rejected }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-200/30 to-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="text-center p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100/50 relative z-10 transform hover:scale-105 transition-all duration-500">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse opacity-30 delay-500"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-3">
            Loading Admin Panel
          </h2>
          <p className="text-gray-600 text-lg">Preparing your dashboard...</p>
          <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  const bookingStats = getBookingStats()

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage users, consultants, bookings, devices, and feedback
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="w-full sm:w-auto bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 hover:text-red-700 bg-transparent w-full sm:w-auto"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 2xl:grid-cols-7 gap-4 min-w-full overflow-x-auto">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u) => u.status === "not-approved").length} pending approval
            </p>
          </CardContent>
        </Card>

        {/* Consultant Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultant Applications</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultantApplications.length}</div>
            <p className="text-xs text-muted-foreground">
              {consultantApplications.filter((a) => a.status === "pending").length} pending review
            </p>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultationBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {consultationBookings.filter((b) => b.status === "pending").length} pending approval
            </p>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              {supplierDevices.filter((d) => !d.status || d.status === "pending").length} pending approval
            </p>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter((o) => !o.status || o.status === "pending").length} pending approval
            </p>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.length}</div>
            <p className="text-xs text-muted-foreground">
              {feedback.filter((f) => !f.status || f.status === "pending").length} pending review
            </p>
          </CardContent>
        </Card>

        {/* Suggested Features */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggested Features</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureSuggestions.length}</div>
            <p className="text-xs text-muted-foreground">
              {featureSuggestions.filter((f) => !f.status || f.status === "pending").length} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-7 min-w-[700px] lg:min-w-0">
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              Users
            </TabsTrigger>
            <TabsTrigger value="consultants" className="text-xs sm:text-sm">
              Consultants
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="devices" className="text-xs sm:text-sm">
              Devices
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              Orders
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm">
              Feedback
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs sm:text-sm">
              Features
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[80px]">Role</TableHead>
                      <TableHead className="min-w-[100px]">Country</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Created</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.country}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>User Details</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <strong>Name:</strong> {`${user.firstName} ${user.lastName}`}
                                      </div>
                                      <div>
                                        <strong>Email:</strong> {user.email}
                                      </div>
                                      <div>
                                        <strong>Phone:</strong> {user.phoneNumber}
                                      </div>
                                      <div>
                                        <strong>Role:</strong> {user.role}
                                      </div>
                                      <div>
                                        <strong>Country:</strong> {user.country}
                                      </div>
                                      <div>
                                        <strong>City:</strong> {user.city}
                                      </div>
                                      <div>
                                        <strong>Address:</strong> {user.address}
                                      </div>
                                      <div>
                                        <strong>Zip Code:</strong> {user.zipCode}
                                      </div>
                                    </div>
                                    {user.verificationFileUrl && (
                                      <div>
                                        <strong>Verification File:</strong>
                                        <a
                                          href={user.verificationFileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline ml-2 break-all"
                                        >
                                          {user.verificationFileName || "View File"}
                                        </a>
                                      </div>
                                    )}

                                    {user.role === "Researcher/Supplier" && user.supplierDocuments && (
                                      <div className="mt-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">Supplier Documents:</h4>

                                        {user.supplierDocuments.companyRegistrationUrl && (
                                          <div className="mb-2">
                                            <strong>Company Registration Certificate:</strong>
                                            <a
                                              href={user.supplierDocuments.companyRegistrationUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline ml-2 break-all"
                                            >
                                              {user.supplierDocuments.companyRegistrationName || "View Certificate"}
                                            </a>
                                          </div>
                                        )}

                                        {user.supplierDocuments.internationalCertUrl && (
                                          <div className="mb-2">
                                            <strong>International Certificate:</strong>
                                            <a
                                              href={user.supplierDocuments.internationalCertUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline ml-2 break-all"
                                            >
                                              {user.supplierDocuments.internationalCertName || "View Certificate"}
                                            </a>
                                          </div>
                                        )}

                                        {user.supplierDocuments.importLicenseUrl && (
                                          <div className="mb-2">
                                            <strong>Import/Distribution License:</strong>
                                            <a
                                              href={user.supplierDocuments.importLicenseUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline ml-2 break-all"
                                            >
                                              {user.supplierDocuments.importLicenseName || "View License"}
                                            </a>
                                          </div>
                                        )}

                                        {user.supplierDocuments.mediGlobalAgreementUrl && (
                                          <div className="mb-2">
                                            <strong>MediGlobal Supplier Agreement:</strong>
                                            <a
                                              href={user.supplierDocuments.mediGlobalAgreementUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline ml-2 break-all"
                                            >
                                              {user.supplierDocuments.mediGlobalAgreementName || "View Agreement"}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {user.role === "Other" && user.otherDocuments && (
                                      <div className="mt-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">Other Documents:</h4>

                                        {user.otherDocuments.idDocUrl && (
                                          <div className="mb-2">
                                            <strong>ID Document (ID Card/Passport):</strong>
                                            <a
                                              href={user.otherDocuments.idDocUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline ml-2 break-all"
                                            >
                                              {user.otherDocuments.idDocName || "View ID Document"}
                                            </a>
                                          </div>
                                        )}

                                        {user.otherDocuments.certificateUrl && (
                                          <div className="mb-2">
                                            <strong>Certificate:</strong>
                                            <a
                                              href={user.otherDocuments.certificateUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline ml-2 break-all"
                                            >
                                              {user.otherDocuments.certificateName || "View Certificate"}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {user.status === "not-approved" && (
                              <>
                                <Button size="sm" onClick={() => handleUserStatusUpdate(user.id, "approved")}>
                                  <Check className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserStatusUpdate(user.id, "rejected")}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultant Applications Tab */}
        <TabsContent value="consultants">
          <Card>
            <CardHeader>
              <CardTitle>Consultant Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Specialization</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Applied</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultantApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.fullName}</TableCell>
                        <TableCell>{application.email}</TableCell>
                        <TableCell>{application.specialization}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>{formatDate(application.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>Consultant Application Details</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-4">
                                    <div>
                                      <strong>Name:</strong> {application.fullName}
                                    </div>
                                    <div>
                                      <strong>Email:</strong> {application.email}
                                    </div>
                                    <div>
                                      <strong>Phone:</strong> {application.phoneNumber}
                                    </div>
                                    <div>
                                      <strong>Specialization:</strong> {application.specialization}
                                    </div>
                                    <div>
                                      <strong>Bio:</strong> {application.shortBio}
                                    </div>
                                    <div>
                                      <strong>Membership Fee:</strong> ${application.membershipFee}
                                    </div>
                                    {application.profilePictureUrl && (
                                      <div className="mb-2">
                                        <strong>Profile Picture:</strong>
                                        <a
                                          href={application.profilePictureUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline ml-2 break-all"
                                        >
                                          View Profile Picture
                                        </a>
                                      </div>
                                    )}

                                    {application.resumeCvUrl && (
                                      <div className="mb-2">
                                        <strong>Resume/CV:</strong>
                                        <a
                                          href={application.resumeCvUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline ml-2 break-all"
                                        >
                                          View Resume/CV
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {application.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConsultantStatusUpdate(application.id, "approved")}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleConsultantStatusUpdate(application.id, "rejected")}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultation Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Consultation Bookings
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage and track all consultation requests</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="group flex items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-blue-700 group-hover:text-blue-800 transition-colors">
                      {bookingStats.total}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Total Bookings</div>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-6 bg-gradient-to-br from-yellow-50 to-amber-100/50 rounded-2xl border border-yellow-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-yellow-700 group-hover:text-yellow-800 transition-colors">
                      {bookingStats.pending}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Pending</div>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-6 bg-gradient-to-br from-emerald-50 to-green-100/50 rounded-2xl border border-green-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                      {bookingStats.accepted}
                    </div>
                    <div className="text-sm text-emerald-600 font-medium">Accepted</div>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-6 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl border border-red-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                    <X className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-red-700 group-hover:text-red-800 transition-colors">
                      {bookingStats.rejected}
                    </div>
                    <div className="text-sm text-red-600 font-medium">Rejected</div>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors duration-300" />
                  <Input
                    placeholder="Search bookings..."
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                    className="pl-12 pr-4 rounded-full border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-300 shadow-sm group-hover:shadow-md"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <div className="flex gap-1 overflow-x-auto">
                    {["all", "pending", "accepted", "rejected"].map((status) => (
                      <Button
                        key={status}
                        variant={bookingFilterStatus === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBookingFilterStatus(status)}
                        className="capitalize whitespace-nowrap rounded-full transition-colors duration-200"
                      >
                        {status}
                        {status !== "all" && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {status === "pending" && bookingStats.pending}
                            {status === "accepted" && bookingStats.accepted}
                            {status === "rejected" && bookingStats.rejected}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-5">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-16 rounded-lg bg-gray-50 border">
                    <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No bookings found</h3>
                    <p className="text-gray-500">There are no consultation requests matching your current criteria.</p>
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border"
                    >
                      <div className="p-5 lg:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-lg">
                                {(booking.clientName || booking.name || "")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-lg text-gray-900 truncate">
                                {booking.clientName || booking.name}
                              </h3>
                              <p className="text-gray-600 truncate">{booking.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {getStatusBadge(booking.status)}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>Booking Details</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                                        <User className="w-4 h-4" />
                                        Client Information
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Name</label>
                                          <p className="text-gray-700">{booking.clientName || booking.name}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Email</label>
                                          <p className="text-gray-700 break-all">{booking.email}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Phone</label>
                                          <p className="text-gray-700">{booking.phone || "Not provided"}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                                        <Stethoscope className="w-4 h-4" />
                                        Consultation Details
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Service Type</label>
                                          <p className="text-gray-700">
                                            {booking.serviceType || booking.consultationType}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Specialty</label>
                                          <p className="text-gray-700">{booking.specialty || "Not specified"}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Assigned Engineer</label>
                                          <p className="text-gray-700">{booking.engineerName || "Not assigned"}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Preferred Date</label>
                                          <p className="text-gray-700">{booking.preferredDate || "Not specified"}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Preferred Time</label>
                                          <p className="text-gray-700">{booking.preferredTime || "Not specified"}</p>
                                        </div>
                                        {booking.engineerId && (
                                          <div>
                                            <label className="text-sm font-medium text-gray-500">Engineer ID</label>
                                            <p className="text-gray-700">{booking.engineerId}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {booking.message && (
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                                          <MessageSquare className="w-4 h-4" />
                                          Message
                                        </h4>
                                        <div className="p-4 bg-gray-50 rounded-md">
                                          <p className="text-gray-700 break-words">{booking.message}</p>
                                        </div>
                                      </div>
                                    )}

                                    {booking.requirements && (
                                      <div>
                                        <h4 className="font-semibold mb-3 text-gray-800">Requirements</h4>
                                        <div className="p-4 bg-gray-50 rounded-md">
                                          <p className="text-gray-700 break-words">{booking.requirements}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Stethoscope className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{booking.serviceType || booking.consultationType}</span>
                          </div>
                          {booking.preferredDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{booking.preferredDate}</span>
                            </div>
                          )}
                          {booking.preferredTime && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{booking.preferredTime}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(booking.createdAt || booking.timestamp)}</span>
                          </div>
                        </div>

                        {(!booking.status || booking.status === "pending") && (
                          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                            <Button
                              size="sm"
                              onClick={() => handleBookingStatusUpdate(booking.id, "accepted")}
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto font-medium"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Accept Booking
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBookingStatusUpdate(booking.id, "rejected")}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto font-medium"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject Booking
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Devices Tab */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Device Name</TableHead>
                      <TableHead className="min-w-[120px]">Company</TableHead>
                      <TableHead className="min-w-[100px]">Category</TableHead>
                      <TableHead className="min-w-[80px]">Type</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Submitted</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">{device.deviceName}</TableCell>
                        <TableCell>{device.companyName}</TableCell>
                        <TableCell>{device.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {device.type === "suppliers_basic"
                              ? "basic"
                              : device.type === "suppliers_premium"
                                ? "premium"
                                : device.type || "basic"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(device.status)}</TableCell>
                        <TableCell>{formatDate(device.timestamp)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>Device Details</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <strong>Device Name:</strong> {device.deviceName}
                                      </div>
                                      <div>
                                        <strong>Company:</strong> {device.companyName}
                                      </div>
                                      <div>
                                        <strong>Category:</strong> {device.category}
                                      </div>
                                      <div>
                                        <strong>Type:</strong>{" "}
                                        {device.type === "suppliers_basic"
                                          ? "basic"
                                          : device.type === "suppliers_premium"
                                            ? "premium"
                                            : device.type || "basic"}
                                      </div>
                                    </div>

                                    {device.specifications && (
                                      <div>
                                        <strong>Basic Specifications:</strong>
                                        <div className="mt-2 space-y-1">
                                          {Object.entries(device.specifications).map(([key, value]) => (
                                            <div key={key} className="text-sm">
                                              <strong>{key}:</strong> {value}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {device.detailedSpecifications && (
                                      <div>
                                        <strong>Detailed Specifications:</strong>
                                        <div className="mt-2 space-y-1">
                                          {device.detailedSpecifications.map((spec, index) => (
                                            <div key={index} className="text-sm">
                                              <strong>{spec.category}:</strong> {spec.value}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {(!device.status || device.status === "pending") && (
                              <>
                                <Button size="sm" onClick={() => handleDeviceStatusUpdate(device, "approved")}>
                                  <Check className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeviceStatusUpdate(device, "rejected")}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Orders Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">View and manage customer orders</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Order ID</TableHead>
                      <TableHead className="min-w-[140px]">Customer</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Order Date</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                        <TableCell>{order.fullName}</TableCell>
                        <TableCell>{order.email}</TableCell>
                        <TableCell>{order.phone}</TableCell>
                        <TableCell className="font-semibold">${order.total?.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>Order Details - #{order.id.slice(-8)}</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Customer Information</h4>
                                        <div className="space-y-1 text-sm">
                                          <div>
                                            <strong>Name:</strong> {order.fullName}
                                          </div>
                                          <div>
                                            <strong>Email:</strong> {order.email}
                                          </div>
                                          <div>
                                            <strong>Phone:</strong> {order.phone}
                                          </div>
                                          <div>
                                            <strong>Address:</strong> {order.address}
                                          </div>
                                          {order.address2 && (
                                            <div>
                                              <strong>Address 2:</strong> {order.address2}
                                            </div>
                                          )}
                                          <div>
                                            <strong>Country:</strong> {order.country}
                                          </div>
                                          <div>
                                            <strong>Zip Code:</strong> {order.zipCode}
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">Order Information</h4>
                                        <div className="space-y-1 text-sm">
                                          <div>
                                            <strong>Order ID:</strong> #{order.id.slice(-8)}
                                          </div>
                                          <div>
                                            <strong>Status:</strong> {order.status}
                                          </div>
                                          <div>
                                            <strong>Delivery Method:</strong> {order.deliveryMethod}
                                          </div>
                                          <div>
                                            <strong>Payment Method:</strong> {order.paymentMethod}
                                          </div>
                                          <div>
                                            <strong>Order Date:</strong> {formatDate(order.createdAt)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-2">Ordered Items</h4>
                                      <div className="space-y-2">
                                        {order.items?.map((item, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                          >
                                            <img
                                              src={item.image || "/images/default-device.png"}
                                              alt={item.name}
                                              className="w-12 h-12 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                              <div className="font-semibold">{item.name}</div>
                                              <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                                              <div className="text-sm text-gray-500">
                                                Price: ${item.price?.toFixed(2)}
                                              </div>
                                            </div>
                                            <div>${(item.price * item.quantity)?.toFixed(2)}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-2">Summary</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Subtotal:</strong> ${order.subtotal?.toFixed(2)}
                                        </div>
                                        <div>
                                          <strong>Shipping:</strong> ${order.shipping?.toFixed(2)}
                                        </div>
                                        <div>
                                          <strong>Tax:</strong> ${order.tax?.toFixed(2)}
                                        </div>
                                        <div>
                                          <strong>Total:</strong> ${order.total?.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {(!order.status || order.status === "pending") && (
                              <>
                                <Button size="sm" onClick={() => updateOrderStatus(order.id, "processing")}>
                                  <Check className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateOrderStatus(order.id, "cancelled")}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                User Feedback
              </CardTitle>
              <p className="text-sm text-muted-foreground">Review and manage user feedback</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">User</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[200px]">Feedback</TableHead>
                      <TableHead className="min-w-[100px]">Rating</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell className="font-medium">{fb.name}</TableCell>
                        <TableCell>{fb.email}</TableCell>
                        <TableCell className="truncate">{fb.feedback}</TableCell>
                        <TableCell>{fb.rating}</TableCell>
                        <TableCell>{getStatusBadge(fb.status)}</TableCell>
                        <TableCell>{formatDate(fb.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>Feedback Details</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="font-semibold mb-2">User Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Name:</strong> {fb.name}
                                        </div>
                                        <div>
                                          <strong>Email:</strong> {fb.email}
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-2">Feedback Details</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Rating:</strong> {fb.rating}
                                        </div>
                                        <div>
                                          <strong>Feedback:</strong> {fb.feedback}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {(!fb.status || fb.status === "pending") && (
                              <>
                                <Button size="sm" onClick={() => handleFeedbackStatusUpdate(fb.id, "approved")}>
                                  <Check className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleFeedbackStatusUpdate(fb.id, "rejected")}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Suggestions Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Feature Suggestions
              </CardTitle>
              <p className="text-sm text-muted-foreground">Review and manage user feature suggestions</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">User</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[200px]">Suggestion</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureSuggestions.map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell className="font-medium">{suggestion.name}</TableCell>
                        <TableCell>{suggestion.email}</TableCell>
                        <TableCell className="truncate">{suggestion.suggestion}</TableCell>
                        <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                        <TableCell>{formatDate(suggestion.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl mx-4">
                                <DialogHeader>
                                  <DialogTitle>Feature Suggestion Details</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="font-semibold mb-2">User Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Name:</strong> {suggestion.name}
                                        </div>
                                        <div>
                                          <strong>Email:</strong> {suggestion.email}
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-2">Suggestion Details</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Suggestion:</strong> {suggestion.suggestion}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {(!suggestion.status || suggestion.status === "pending") && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleFeatureSuggestionStatusUpdate(suggestion.id, "approved")}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleFeatureSuggestionStatusUpdate(suggestion.id, "rejected")}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
