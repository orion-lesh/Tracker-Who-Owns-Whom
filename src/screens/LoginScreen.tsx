import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from "react-native";
import { Lock, Sparkles, UserPlus, Globe, ArrowRight } from "lucide-react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { MOCK_USERS, registerNewUser, setActiveUser } from "../api/debts";
import { User } from "../types";

interface LoginScreenProps {
  onSignInSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignInSuccess }) => {
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [provisionLoading, setProvisionLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");

  const handleSignInExisting = (user: User) => {
    setLoadingProfileId(user.id);
    setTimeout(() => {
      setActiveUser(user.id);
      setLoadingProfileId(null);
      onSignInSuccess();
    }, 600);
  };

  const handleProvisionSubmit = () => {
    setErrorText("");
    if (!customName.trim()) {
      setErrorText("Name is required.");
      return;
    }
    if (!customEmail.trim() || !customEmail.includes("@")) {
      setErrorText("Enter a valid email address.");
      return;
    }

    setProvisionLoading(true);
    setTimeout(() => {
      try {
        const newUser = registerNewUser(customName.trim(), customEmail.trim().toLowerCase());
        setProvisionLoading(false);
        setIsProvisioning(false);
        setCustomName("");
        setCustomEmail("");
        onSignInSuccess();
      } catch (err) {
        setErrorText("This email is already registered.");
        setProvisionLoading(false);
      }
    }, 800);
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 justify-center">
      <StatusBar barStyle="light-content" />

      {/* Decorative background glows */}
      <View className="absolute top-20 left-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl" />
      <View className="absolute bottom-20 right-10 w-44 h-44 bg-violet-600/10 rounded-full blur-3xl" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 40 }}
      >
        {/* Logo and Tagline */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl justify-center items-center shadow-2xl shadow-indigo-500/30 mb-4">
            <Globe size={32} color="#ffffff" />
          </View>
          <Text className="text-white text-3xl font-black tracking-tight text-center">
            Who Owns Whom
          </Text>
          <Text className="text-slate-400 text-sm text-center mt-2 px-6 leading-relaxed">
            Mutual transparency for personal debts and shared expenses.
          </Text>
        </View>

        {!isProvisioning ? (
          <View className="space-y-5">
            {/* Existing profiles card */}
            <Card className="bg-slate-900 border-slate-800 p-5 rounded-3xl">
              <View className="flex-row items-center mb-4 space-x-2">
                <Lock size={16} color="#818cf8" />
                <Text className="text-white text-base font-bold ml-1.5">Sign In (Demo Accounts)</Text>
              </View>
              <Text className="text-slate-450 text-xs mb-4 leading-normal">
                Click a profile to simulate signing in via Google.
              </Text>

              <View className="space-y-2.5">
                {MOCK_USERS.map((user) => {
                  const isLoading = loadingProfileId === user.id;
                  return (
                    <TouchableOpacity
                      key={user.id}
                      disabled={loadingProfileId !== null}
                      onPress={() => handleSignInExisting(user)}
                      className="flex-row items-center justify-between p-3.5 bg-slate-950 border border-slate-850 active:bg-slate-900 rounded-xl"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 rounded-full bg-slate-800 justify-center items-center mr-3 border border-slate-750">
                          <Text className="text-slate-300 font-bold text-sm">
                            {user.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-white font-bold text-sm">{user.displayName}</Text>
                          <Text className="text-slate-500 text-xs mt-0.5">{user.email}</Text>
                        </View>
                      </View>

                      {isLoading ? (
                        <ActivityIndicator size="small" color="#818cf8" />
                      ) : (
                        <ArrowRight size={16} color="#475569" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Custom Google registration simulation */}
            <TouchableOpacity
              onPress={() => setIsProvisioning(true)}
              className="flex-row items-center justify-center p-4 bg-slate-900/40 border border-dashed border-indigo-500/20 active:bg-indigo-950/10 rounded-2xl space-x-2"
            >
              <UserPlus size={16} color="#818cf8" />
              <Text className="text-indigo-400 font-semibold text-sm ml-1.5">
                Simulate New Google Registration
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Card className="bg-slate-900 border-slate-800 p-6 rounded-3xl space-y-4">
            <View className="flex-row items-center justify-between border-b border-slate-800 pb-3">
              <View className="flex-row items-center">
                <Sparkles size={18} color="#818cf8" />
                <Text className="text-white text-base font-bold ml-2">Google ID Token Provisioning</Text>
              </View>
              <TouchableOpacity onPress={() => setIsProvisioning(false)}>
                <Text className="text-slate-500 text-xs font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-xs leading-normal">
              Entering a custom name and email simulates receiving a Google ID Token. If new, a user profile is auto-provisioned.
            </Text>

            <View className="space-y-3">
              <Input
                label="Full Name"
                placeholder="e.g. David Miller"
                value={customName}
                onChangeText={setCustomName}
              />
              <Input
                label="Google Email Address"
                placeholder="e.g. david.miller@gmail.com"
                value={customEmail}
                onChangeText={(text) => setCustomEmail(text.toLowerCase())} // Auto lowercase
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {errorText ? (
                <Text className="text-rose-500 text-xs font-semibold">{errorText}</Text>
              ) : null}

              <Button
                title="Provision & Sign In"
                variant="default"
                className="bg-indigo-600 active:bg-indigo-700 mt-4 h-12"
                onPress={handleProvisionSubmit}
                loading={provisionLoading}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};
