import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Formik } from "formik";
import { useAuth } from "../context/AuthContext";
import { loginValidationSchema } from "../utils/validationSchemas";
import { authScreenStyles } from "../utils/styleHelpers";

interface LoginScreenProps {
  onSignupPress: () => void;
}

export default function LoginScreen({ onSignupPress }: LoginScreenProps) {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "An error occurred");
    }
  };

  return (
    <SafeAreaView style={authScreenStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authScreenStyles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>PhotoSync</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginValidationSchema}
            onSubmit={handleLogin}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={authScreenStyles.formContainer}>
                {/* Email Input */}
                <View style={authScreenStyles.fieldContainer}>
                  <Text style={authScreenStyles.label}>Email Address</Text>
                  <TextInput
                    style={[
                      authScreenStyles.input,
                      touched.email && errors.email
                        ? authScreenStyles.inputError
                        : undefined,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    value={values.email}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {touched.email && errors.email && (
                    <Text style={authScreenStyles.errorText}>
                      {errors.email}
                    </Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={authScreenStyles.fieldContainer}>
                  <Text style={authScreenStyles.label}>Password</Text>
                  <View
                    style={[
                      authScreenStyles.passwordContainer,
                      touched.password && errors.password
                        ? authScreenStyles.inputError
                        : undefined,
                    ]}
                  >
                    <TextInput
                      style={authScreenStyles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      value={values.password}
                      editable={!isLoading}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Text style={authScreenStyles.togglePasswordText}>
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={authScreenStyles.errorText}>
                      {errors.password}
                    </Text>
                  )}
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    authScreenStyles.authButton,
                    isLoading && authScreenStyles.buttonDisabled,
                  ]}
                  onPress={() => handleSubmit()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={authScreenStyles.authButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={authScreenStyles.dividerContainer}>
                  <View style={authScreenStyles.divider} />
                  <Text style={authScreenStyles.dividerText}>or</Text>
                  <View style={authScreenStyles.divider} />
                </View>

                {/* Signup Link */}
                <View style={authScreenStyles.authLinkContainer}>
                  <Text style={authScreenStyles.authLinkText}>
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={onSignupPress}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        authScreenStyles.authLinkButton,
                        isLoading && authScreenStyles.linkDisabled,
                      ]}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: "center",
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
