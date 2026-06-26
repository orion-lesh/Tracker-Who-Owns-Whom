import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  X,
  Clock,
  Bell,
  Wallet,
  ArrowRightLeft,
  ChevronRight,
  Users,
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react-native";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  getDashboardSummary,
  approveDebt,
  rejectDebt,
  getActiveUser,
  setActiveUser,
  MOCK_USERS,
  createDebt,
  searchUserByEmail,
  requestSettleDebt,
} from "../api/debts";
import { DashboardData, Debt, User } from "../types";

export interface DashboardScreenProps {
  onSignOut: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onSignOut }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [processingDebtId, setProcessingDebtId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PENDING" | "SETTLED">("ALL");

  // Modals state
  const [userModalVisible, setUserModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [settleModalVisible, setSettleModalVisible] = useState<boolean>(false);

  // Form states for creating debt
  const [isIowedType, setIsIowedType] = useState<boolean>(true); // true = "I am owed", false = "I owe"
  const [emailInput, setEmailInput] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [currencyInput, setCurrencyInput] = useState<string>("USD");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [hasMockAttachment, setHasMockAttachment] = useState<boolean>(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  const currentUser = getActiveUser();
  const initials = currentUser.displayName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Email validation search effect
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (emailInput.trim().length > 3) {
        setIsSearching(true);
        const user = await searchUserByEmail(emailInput);
        setFoundUser(user);
        setIsSearching(false);
      } else {
        setFoundUser(null);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [emailInput]);

  const handleApprove = async (debtId: string) => {
    try {
      setProcessingDebtId(debtId);
      const success = await approveDebt(debtId);
      if (success) {
        // Reload summary dynamically from state store
        const summary = await getDashboardSummary();
        setData(summary);
        Alert.alert("Confirmed", "The debt is now officially active and reflected in your balance.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to approve debt");
    } finally {
      setProcessingDebtId(null);
    }
  };

  const handleReject = async (debtId: string) => {
    try {
      setProcessingDebtId(debtId);
      const success = await rejectDebt(debtId);
      if (success) {
        const summary = await getDashboardSummary();
        setData(summary);
        Alert.alert("Rejected", "The debt request has been declined.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to reject debt");
    } finally {
      setProcessingDebtId(null);
    }
  };

  const handleSettle = async (debtId: string) => {
    try {
      setProcessingDebtId(debtId);
      const success = await requestSettleDebt(debtId);
      if (success) {
        const summary = await getDashboardSummary();
        setData(summary);
        Alert.alert("Settled", "The debt has been marked as settled.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to settle debt");
    } finally {
      setProcessingDebtId(null);
    }
  };

  const handleCreateDebtSubmit = async () => {
    if (!foundUser) {
      Alert.alert("Error", "Please select a valid counterparty using a registered email.");
      return;
    }

    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0.");
      return;
    }

    if (!descriptionInput.trim()) {
      Alert.alert("Error", "Please enter a description for the debt.");
      return;
    }

    try {
      setSubmitLoading(true);
      
      // Determine creditor and debtor
      const debtorId = isIowedType ? foundUser.id : currentUser.id;
      const creditorId = isIowedType ? currentUser.id : foundUser.id;

      await createDebt({
        debtorId,
        creditorId,
        amount: parsedAmount,
        currency: currencyInput,
        description: descriptionInput,
        attachmentUrl: hasMockAttachment ? "https://example.com/receipt.jpg" : undefined,
      });

      // Reload
      const summary = await getDashboardSummary();
      setData(summary);

      // Reset form
      setCreateModalVisible(false);
      setEmailInput("");
      setAmountInput("");
      setDescriptionInput("");
      setHasMockAttachment(false);
      setFoundUser(null);

      Alert.alert("Success", "Debt entry logged! Awaiting confirmation from your friend.");
    } catch (error) {
      Alert.alert("Error", "Failed to create debt");
    } finally {
      setSubmitLoading(false);
    }
  };

  const switchActiveUser = async (userId: string) => {
    setActiveUser(userId);
    setUserModalVisible(false);
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-400 mt-4 text-base font-medium">
          Loading your financial balance...
        </Text>
      </View>
    );
  }

  // Get pending items needing current user approval
  const pendingApprovals = data?.recentActivities.filter(
    (act) => act.status === "PENDING_APPROVAL" && act.creatorId !== currentUser.id
  ) || [];

  // Filter activities based on tab
  const filteredActivities = data?.recentActivities.filter((act) => {
    if (activeTab === "ACTIVE") return act.status === "ACTIVE";
    if (activeTab === "PENDING") return act.status === "PENDING_APPROVAL";
    if (activeTab === "SETTLED") return act.status === "SETTLED" || act.status === "REJECTED";
    return true; // "ALL"
  }) || [];

  // Get active debts to display in settle modal
  const activeDebtsToSettle = data?.recentActivities.filter(
    (act) => act.status === "ACTIVE"
  ) || [];

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />

      {/* HEADER SECTION */}
      <View className="px-6 pt-14 pb-6 flex-row items-center justify-between border-b border-slate-900 bg-slate-950/80">
        <TouchableOpacity
          onPress={() => setUserModalVisible(true)}
          className="flex-row items-center space-x-3 active:opacity-80"
        >
          <View className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 justify-center items-center shadow-lg shadow-indigo-500/20">
            <Text className="text-white font-bold text-lg">{initials}</Text>
          </View>
          <View className="ml-3">
            <View className="flex-row items-center">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Welcome back
              </Text>
              <View className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex-row items-center">
                <Sparkles size={8} color="#818cf8" />
                <Text className="text-[8px] text-indigo-400 font-bold uppercase ml-0.5">Demo Mode</Text>
              </View>
            </View>
            <Text className="text-white text-lg font-bold">{currentUser.displayName}</Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => setUserModalVisible(true)}
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800 active:scale-95 flex-row items-center"
          >
            <Users size={18} color="#818cf8" />
          </TouchableOpacity>

          <TouchableOpacity className="relative p-2.5 rounded-full bg-slate-900 border border-slate-800 active:scale-95">
            <Bell size={18} color="#cbd5e1" />
            {data && data.pendingCount > 0 && (
              <View className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full justify-center items-center">
                <Text className="text-[10px] text-white font-bold">
                  {data.pendingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="flex-1 px-6 pt-6"
      >
        {/* HERO BALANCE SECTION */}
        <Text className="text-white text-xl font-extrabold mb-4 tracking-tight">
          Active Balances
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="space-x-4 mb-8 -mx-6 px-6"
        >
          {data?.balances.map((balance) => {
            const isOwedNet = balance.netAmount >= 0;
            return (
              <Card
                key={balance.currency}
                className={`w-[290px] mr-4 border-0 p-0 overflow-hidden bg-gradient-to-br ${
                  isOwedNet
                    ? "from-slate-900 via-slate-900 to-indigo-950"
                    : "from-slate-900 via-slate-900 to-rose-950/60"
                }`}
              >
                {/* Glow accent */}
                <View
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isOwedNet ? "bg-indigo-500" : "bg-rose-500"
                  }`}
                />

                <CardHeader className="p-5 pb-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 font-semibold tracking-wider text-xs uppercase">
                      Net Summary ({balance.currency})
                    </Text>
                    <Wallet
                      size={18}
                      color={isOwedNet ? "#818cf8" : "#f43f5e"}
                    />
                  </View>
                  <Text
                    className={`text-3xl font-extrabold mt-2 tracking-tight ${
                      isOwedNet ? "text-indigo-400" : "text-rose-400"
                    }`}
                  >
                    {isOwedNet ? "+" : ""}
                    {balance.netAmount.toFixed(2)} {balance.currency}
                  </Text>
                  <Text className="text-slate-500 text-xs font-medium mt-1">
                    {isOwedNet
                      ? "Net balance: People owe you"
                      : "Net balance: You owe people"}
                  </Text>
                </CardHeader>

                <CardContent className="p-5 pt-4 flex-row justify-between border-t border-slate-800/60">
                  <View className="flex-row items-center space-x-2">
                    <View className="w-8 h-8 rounded-full bg-emerald-950/80 justify-center items-center mr-2">
                      <ArrowDownLeft size={16} color="#34d399" />
                    </View>
                    <View>
                      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        Owed to you
                      </Text>
                      <Text className="text-emerald-400 font-semibold text-sm">
                        {balance.totalOwedToMe.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center space-x-2">
                    <View className="w-8 h-8 rounded-full bg-rose-950/80 justify-center items-center mr-2">
                      <ArrowUpRight size={16} color="#f87171" />
                    </View>
                    <View>
                      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        You owe
                      </Text>
                      <Text className="text-rose-400 font-semibold text-sm">
                        {balance.totalIOwe.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </ScrollView>

        {/* PENDING APPROVALS SECTION */}
        {pendingApprovals.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center space-x-2 mb-4">
              <Clock size={18} color="#f59e0b" />
              <Text className="text-white text-xl font-bold tracking-tight ml-2">
                Pending Approvals ({pendingApprovals.length})
              </Text>
            </View>

            {pendingApprovals.map((debt) => (
              <Card key={debt.id} className="mb-4 bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-2">
                      <View className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 justify-center items-center mr-2">
                        <Text className="text-indigo-400 font-bold text-sm">
                          {debt.counterpartyName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-sm">
                          {debt.counterpartyName}
                        </Text>
                        <Text className="text-slate-400 text-xs">
                          {debt.isIowed ? "wants to confirm you owe:" : "wants to confirm they owe you:"}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className={`font-extrabold text-lg ${
                        debt.isIowed ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {debt.isIowed ? "+" : "-"}
                      {debt.amount.toFixed(2)} {debt.currency}
                    </Text>
                  </View>
                  <Text className="text-slate-300 text-sm mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800 italic">
                    "{debt.description}"
                  </Text>
                  {debt.attachmentUrl && (
                    <View className="mt-2.5 flex-row items-center bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <Camera size={14} color="#818cf8" />
                      <Text className="text-indigo-400 text-xs font-semibold ml-2">Receipt attached</Text>
                    </View>
                  )}
                </CardHeader>

                <View className="flex-row space-x-3 px-5 pb-5">
                  <Button
                    title="Decline"
                    variant="outline"
                    size="sm"
                    className="flex-1 border-rose-500/20 active:bg-rose-950/20 h-10"
                    textClassName="text-rose-400 font-semibold"
                    onPress={() => handleReject(debt.id)}
                    disabled={processingDebtId !== null}
                    icon={<X size={14} color="#f43f5e" />}
                  />
                  <Button
                    title="Confirm"
                    variant="default"
                    size="sm"
                    className="flex-1 bg-indigo-600 active:bg-indigo-700 h-10"
                    onPress={() => handleApprove(debt.id)}
                    disabled={processingDebtId !== null}
                    loading={processingDebtId === debt.id}
                    icon={<Check size={14} color="#ffffff" />}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* RECENT ACTIVITY */}
        <View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold tracking-tight">
              Activity History
            </Text>
          </View>

          {/* Filtering tabs */}
          <View className="flex-row bg-slate-900 border border-slate-800 p-1 rounded-xl mb-4 space-x-1">
            {(["ALL", "ACTIVE", "PENDING", "SETTLED"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg justify-center items-center ${
                  activeTab === tab ? "bg-indigo-600" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeTab === tab ? "text-white" : "text-slate-400"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredActivities.length === 0 ? (
            <View className="bg-slate-900/50 border border-slate-900 rounded-xl p-8 items-center justify-center">
              <Text className="text-slate-500 text-sm text-center font-medium">
                No history matches this filter.
              </Text>
            </View>
          ) : (
            filteredActivities.map((activity) => {
              const isOwed = activity.isIowed;
              const statusColors = {
                PENDING_APPROVAL: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                ACTIVE: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                REJECTED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                SETTLED: "bg-slate-800 text-slate-400 border border-slate-700",
              };

              return (
                <View
                  key={activity.id}
                  className="flex-row items-center justify-between p-4 mb-3 bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl"
                >
                  <View className="flex-row items-center flex-1 pr-4">
                    <View
                      className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
                        isOwed ? "bg-emerald-950/50" : "bg-rose-950/50"
                      }`}
                    >
                      {isOwed ? (
                        <ArrowDownLeft size={18} color="#34d399" />
                      ) : (
                        <ArrowUpRight size={18} color="#f87171" />
                      )}
                    </View>
                    <View className="flex-1 ml-1">
                      <Text className="text-white font-bold text-sm">
                        {activity.counterpartyName}
                      </Text>
                      <Text
                        className="text-slate-400 text-xs mt-0.5 font-medium"
                        numberOfLines={1}
                      >
                        {activity.description}
                      </Text>
                      <View className="flex-row items-center mt-1 space-x-2">
                        <Text className="text-slate-500 text-[10px] font-semibold">
                          {new Date(activity.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        {activity.attachmentUrl && (
                          <View className="flex-row items-center">
                            <Text className="text-slate-600 text-[10px] mx-1">•</Text>
                            <Camera size={10} color="#64748b" />
                            <Text className="text-slate-500 text-[10px] ml-1 font-medium">Receipt</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`font-black text-base ${
                        isOwed ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isOwed ? "+" : "-"}
                      {activity.amount.toFixed(2)} {activity.currency}
                    </Text>
                    <View
                      className={`px-2.5 py-0.5 rounded-full mt-2 ${
                        statusColors[activity.status]
                      }`}
                    >
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-center">
                        {activity.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BOTTOM CONTAINER */}
      <View className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-slate-950/90 border-t border-slate-900 flex-row space-x-4">
        <Button
          title="Settle Balance"
          variant="outline"
          className="flex-1 border-indigo-500/30 active:bg-indigo-950/10 h-13 rounded-xl"
          textClassName="text-indigo-400 font-bold"
          onPress={() => setSettleModalVisible(true)}
          icon={<ArrowRightLeft size={16} color="#818cf8" />}
        />
        <Button
          title="Log New Debt"
          variant="default"
          className="flex-1 bg-indigo-600 active:bg-indigo-700 shadow-lg shadow-indigo-600/20 h-13 rounded-xl"
          onPress={() => setCreateModalVisible(true)}
          icon={<Plus size={16} color="#ffffff" />}
        />
      </View>

      {/* MODAL 1: SWITCH DEMO USER PROFILE */}
      <Modal
        visible={userModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <View className="flex-row items-center justify-between border-b border-slate-800 pb-3">
              <Text className="text-white text-lg font-bold">Switch Account Profile</Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text className="text-slate-400 text-xs leading-normal">
              Select an account to view their perspective and approve/reject pending debts for demo simulation.
            </Text>

            <View className="space-y-3 mt-2">
              {MOCK_USERS.map((user) => {
                const isActive = user.id === currentUser.id;
                return (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => switchActiveUser(user.id)}
                    className={`flex-row items-center justify-between p-3.5 rounded-xl border ${
                      isActive
                        ? "bg-indigo-600/10 border-indigo-500/50"
                        : "bg-slate-950 border-slate-800/80 active:bg-slate-900"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 justify-center items-center mr-3">
                        <Text className="text-slate-300 font-bold">
                          {user.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold">{user.displayName}</Text>
                        <Text className="text-slate-500 text-xs mt-0.5">{user.email}</Text>
                      </View>
                    </View>
                    {isActive && <Check size={18} color="#818cf8" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="border-t border-slate-800 pt-4 mt-2">
              <Button
                title="Sign Out of Account"
                variant="destructive"
                className="h-12 w-full rounded-xl bg-rose-600 active:bg-rose-700"
                onPress={() => {
                  setUserModalVisible(false);
                  onSignOut();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: LOG NEW DEBT */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 max-h-[92%] pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-800 pb-3">
              <Text className="text-white text-xl font-bold">Log New Debt</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Type Switcher */}
              <View className="flex flex-col space-y-1.5">
                <Text className="text-sm font-semibold text-slate-300">Debt Direction</Text>
                <View className="flex-row bg-slate-950 border border-slate-800 p-1 rounded-xl space-x-1">
                  <TouchableOpacity
                    onPress={() => setIsIowedType(true)}
                    className={`flex-1 py-3 rounded-lg justify-center items-center ${
                      isIowedType ? "bg-indigo-600" : "bg-transparent"
                    }`}
                  >
                    <Text className={`font-bold text-sm ${isIowedType ? "text-white" : "text-slate-400"}`}>
                      I am owed (Lent money)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsIowedType(false)}
                    className={`flex-1 py-3 rounded-lg justify-center items-center ${
                      !isIowedType ? "bg-rose-600" : "bg-transparent"
                    }`}
                  >
                    <Text className={`font-bold text-sm ${!isIowedType ? "text-white" : "text-slate-400"}`}>
                      I owe (Borrowed money)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Email Input */}
              <View className="mt-2.5">
                <Input
                  label="Counterparty Registered Email"
                  placeholder="alex.rivera@example.com"
                  value={emailInput}
                  onChangeText={setEmailInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {/* Loading or Search Indicator */}
                {isSearching && (
                  <View className="flex-row items-center mt-1 px-1">
                    <ActivityIndicator size="small" color="#818cf8" />
                    <Text className="text-slate-500 text-xs ml-2">Searching user registry...</Text>
                  </View>
                )}

                {/* Suggestion list of demo users */}
                {emailInput.length <= 3 && (
                  <View className="mt-2">
                    <Text className="text-slate-500 text-xs mb-1.5">Demo suggestions:</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {MOCK_USERS.filter((u) => u.id !== currentUser.id).map((u) => (
                        <TouchableOpacity
                          key={u.id}
                          onPress={() => setEmailInput(u.email)}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg"
                        >
                          <Text className="text-slate-400 text-xs">{u.displayName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Validation Feedback */}
                {emailInput.trim().length > 3 && !isSearching && (
                  <View className="mt-1.5 px-1">
                    {foundUser ? (
                      <View className="flex-row items-center">
                        <CheckCircle2 size={14} color="#34d399" />
                        <Text className="text-emerald-400 text-xs font-semibold ml-2">
                          Matches registered user: {foundUser.displayName}
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <AlertCircle size={14} color="#f43f5e" />
                        <Text className="text-rose-400 text-xs font-semibold ml-2">
                          User not found in registry.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Amount and Currency */}
              <View className="flex-row space-x-3 mt-2.5">
                <View className="flex-1">
                  <Input
                    label="Amount"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={amountInput}
                    onChangeText={setAmountInput}
                  />
                </View>
                <View className="w-[100px]">
                  <Text className="text-sm font-semibold text-slate-300 mb-1">Currency</Text>
                  <View className="flex-row bg-slate-950 border border-slate-800 h-12 rounded-xl overflow-hidden justify-around items-center">
                    {(["USD", "EUR"] as const).map((curr) => (
                      <TouchableOpacity
                        key={curr}
                        onPress={() => setCurrencyInput(curr)}
                        className={`flex-1 h-full justify-center items-center ${
                          currencyInput === curr ? "bg-slate-800" : "bg-transparent"
                        }`}
                      >
                        <Text className={`font-bold text-xs ${currencyInput === curr ? "text-indigo-400" : "text-slate-400"}`}>
                          {curr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Description */}
              <View className="mt-2.5">
                <Input
                  label="Description / Purpose"
                  placeholder="e.g. Dinner, Concert tickets, Gas"
                  value={descriptionInput}
                  onChangeText={setDescriptionInput}
                />
              </View>

              {/* Mock Receipt Upload */}
              <View className="mt-2.5">
                <Text className="text-sm font-semibold text-slate-300 mb-1">Attach Receipt</Text>
                <TouchableOpacity
                  onPress={() => setHasMockAttachment(!hasMockAttachment)}
                  className={`flex-row items-center justify-center p-4 border border-dashed rounded-xl ${
                    hasMockAttachment
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <Camera size={18} color={hasMockAttachment ? "#818cf8" : "#94a3b8"} />
                  <Text className={`font-semibold text-sm ml-2 ${hasMockAttachment ? "text-indigo-400" : "text-slate-400"}`}>
                    {hasMockAttachment ? "Receipt Mocked (receipt.jpg)" : "Simulate uploading receipt photo"}
                  </Text>
                  {hasMockAttachment && (
                    <TouchableOpacity onPress={() => setHasMockAttachment(false)} className="ml-auto p-1 bg-slate-800 rounded-full">
                      <X size={12} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row space-x-3 pt-6 mt-4">
                <Button
                  title="Cancel"
                  variant="ghost"
                  className="flex-1 border border-slate-800 text-slate-400"
                  onPress={() => setCreateModalVisible(false)}
                />
                <Button
                  title="Log Debt"
                  variant="default"
                  className="flex-1 bg-indigo-600 active:bg-indigo-700"
                  onPress={handleCreateDebtSubmit}
                  loading={submitLoading}
                  disabled={submitLoading || !foundUser}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: SETTLE BALANCE LIST */}
      <Modal
        visible={settleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettleModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 max-h-[85%] pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-800 pb-3">
              <Text className="text-white text-xl font-bold">Settle Active Balances</Text>
              <TouchableOpacity onPress={() => setSettleModalVisible(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-slate-400 text-xs mb-4 leading-normal">
                Below are all confirmed active debts involving you. Mark one as settled when payment is completed.
              </Text>

              {activeDebtsToSettle.length === 0 ? (
                <View className="py-10 items-center justify-center">
                  <AlertCircle size={32} color="#64748b" />
                  <Text className="text-slate-500 font-bold text-sm mt-3 text-center">
                    No active debts found to settle.
                  </Text>
                  <Text className="text-slate-600 text-xs mt-1 text-center">
                    Only confirmed (Active) debts can be settled.
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {activeDebtsToSettle.map((debt) => (
                    <Card key={debt.id} className="bg-slate-950 border-slate-850 p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-grow pr-4">
                          <Text className="text-white font-bold text-sm">
                            {debt.counterpartyName}
                          </Text>
                          <Text className="text-slate-450 text-xs mt-0.5" numberOfLines={1}>
                            {debt.description}
                          </Text>
                          <Text className="text-slate-500 text-[10px] mt-1">
                            {new Date(debt.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="items-end mr-3">
                          <Text className={`font-extrabold text-sm ${debt.isIowed ? "text-emerald-400" : "text-rose-400"}`}>
                            {debt.isIowed ? "Owed to you:" : "You owe:"}
                          </Text>
                          <Text className="text-white font-bold text-base mt-0.5">
                            {debt.amount.toFixed(2)} {debt.currency}
                          </Text>
                        </View>
                        <Button
                          title="Settle"
                          size="sm"
                          variant={debt.isIowed ? "outline" : "default"}
                          className={`h-9 px-3 rounded-lg ${
                            debt.isIowed
                              ? "border-emerald-500/20 active:bg-emerald-950/20"
                              : "bg-indigo-600 active:bg-indigo-700"
                          }`}
                          textClassName={debt.isIowed ? "text-emerald-400" : "text-white"}
                          onPress={() => {
                            setSettleModalVisible(false);
                            handleSettle(debt.id);
                          }}
                          disabled={processingDebtId !== null}
                        />
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
