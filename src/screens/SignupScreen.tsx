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
import { signupValidationSchema } from "../utils/validationSchemas";
import { authScreenStyles } from "../utils/styleHelpers";

interface SignupScreenProps {
  onLoginPress: () => void;
}

export default function SignupScreen({ onLoginPress }: SignupScreenProps) {
  const { signup, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (values: {
    email: string;
    username: string;
    name: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      await signup(values.email, values.username, values.name, values.password);
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "An error occurred");
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join PhotoSync today</Text>
          </View>

          {/* Form */}
          <Formik
            initialValues={{
              email: "",
              username: "",
              name: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={signupValidationSchema}
            onSubmit={handleSignup}
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
                {/* Full Name Input */}
                <View style={authScreenStyles.fieldContainer}>
                  <Text style={authScreenStyles.label}>Full Name</Text>
                  <TextInput
                    style={[
                      authScreenStyles.input,
                      touched.name && errors.name
                        ? authScreenStyles.inputError
                        : undefined,
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    value={values.name}
                    editable={!isLoading}
                  />
                  {touched.name && errors.name && (
                    <Text style={authScreenStyles.errorText}>
                      {errors.name}
                    </Text>
                  )}
                </View>

                {/* Username Input */}
                <View style={authScreenStyles.fieldContainer}>
                  <Text style={authScreenStyles.label}>Username</Text>
                  <TextInput
                    style={[
                      authScreenStyles.input,
                      touched.username && errors.username
                        ? authScreenStyles.inputError
                        : undefined,
                    ]}
                    placeholder="Choose a username"
                    placeholderTextColor="#999"
                    onChangeText={handleChange("username")}
                    onBlur={handleBlur("username")}
                    value={values.username}
                    editable={!isLoading}
                    autoCapitalize="none"
                  />
                  {touched.username && errors.username && (
                    <Text style={authScreenStyles.errorText}>
                      {errors.username}
                    </Text>
                  )}
                </View>

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
                      placeholder="Create a password"
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

                {/* Confirm Password Input */}
                <View style={authScreenStyles.fieldContainer}>
                  <Text style={authScreenStyles.label}>Confirm Password</Text>
                  <View
                    style={[
                      authScreenStyles.passwordContainer,
                      touched.confirmPassword && errors.confirmPassword
                        ? authScreenStyles.inputError
                        : undefined,
                    ]}
                  >
                    <TextInput
                      style={authScreenStyles.passwordInput}
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      value={values.confirmPassword}
                      editable={!isLoading}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      <Text style={authScreenStyles.togglePasswordText}>
                        {showConfirmPassword ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <Text style={authScreenStyles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  )}
                </View>

                {/* Signup Button */}
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
                    <Text style={authScreenStyles.authButtonText}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={authScreenStyles.dividerContainer}>
                  <View style={authScreenStyles.divider} />
                  <Text style={authScreenStyles.dividerText}>or</Text>
                  <View style={authScreenStyles.divider} />
                </View>

                {/* Login Link */}
                <View style={authScreenStyles.authLinkContainer}>
                  <Text style={authScreenStyles.authLinkText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={onLoginPress} disabled={isLoading}>
                    <Text
                      style={[
                        authScreenStyles.authLinkButton,
                        isLoading && authScreenStyles.linkDisabled,
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Terms */}
                <Text style={styles.termsText}>
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy.
                </Text>
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
    paddingVertical: 32,
    justifyContent: "center",
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
