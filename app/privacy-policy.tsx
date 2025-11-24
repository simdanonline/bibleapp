/* eslint-disable react/no-unescaped-entities */
import React, { JSX } from "react";
import {
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function PrivacyPolicy(): JSX.Element {
  const openEmail = () => Linking.openURL("mailto:support@simdan.dev");

  return (
    <>
      <View>
        {Platform.OS === "web" && (
          <>
            <title>Privacy Policy — Bible App</title>
            <meta
              name="description"
              content="Privacy Policy for Bible App: what data we collect, how we use it, and how to contact us."
            />
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.h1}>Privacy Policy</Text>
          <Text style={styles.effective}>
            Effective date: November 23, 2025
          </Text>

          <Text style={styles.paragraph}>
            Thank you for choosing Bible App ("we", "us", or "our"). This
            Privacy Policy explains how we collect, use, share, and protect
            information when you use the web version of Bible App and related
            services. By using the web version you agree to the practices
            described here.
          </Text>

          <Text style={styles.h2}>1. Information We Collect</Text>
          <View style={styles.list}>
            <Text style={styles.li}>
              • <Text style={styles.bold}>Personal Information:</Text>{" "}
              Information you provide directly, such as your name and email when
              contacting support or creating an account (if applicable).
            </Text>
            <Text style={styles.li}>
              • <Text style={styles.bold}>Usage Data:</Text> Automatically
              collected information about use of the web site, such as pages
              viewed, feature usage, timestamps, device and browser type, and IP
              address.
            </Text>
            <Text style={styles.li}>
              • <Text style={styles.bold}>Offline Data:</Text> Reading progress,
              notes and bookmarks saved locally in your browser or device
              storage. These remain local unless you opt to sync or back up.
            </Text>
            <Text style={styles.li}>
              • <Text style={styles.bold}>Cookies & Similar Technologies:</Text>{" "}
              Cookies and local storage may be used to support preferences,
              sessions, and analytics.
            </Text>
          </View>

          <Text style={styles.h2}>2. How We Use Information</Text>
          <Text style={styles.paragraph}>
            We use data to provide and improve the service, store and retrieve
            your reading progress (if you opt to sync), respond to support
            requests, analyze usage, and send administrative messages.
          </Text>

          <Text style={styles.h2}>3. Third‑Party Services</Text>
          <Text style={styles.paragraph}>
            We may use third‑party services for analytics, hosting, and crash
            reporting. These providers may collect certain session or device
            data. If you need the exact list of third‑party services we use,
            please contact us and we will include them here.
          </Text>

          <Text style={styles.h2}>4. Cookies and Tracking</Text>
          <Text style={styles.paragraph}>
            Cookies help us remember preferences and provide analytics. You can
            control cookie settings in your browser, but blocking some cookies
            may reduce functionality.
          </Text>

          <Text style={styles.h2}>5. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain personal information only as long as necessary for the
            purposes described in this policy and as required by law.
            Local/offline data stays on your device until you delete it.
          </Text>

          <Text style={styles.h2}>6. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement reasonable measures to protect information, but no
            system is completely secure. Please help protect your account and
            device.
          </Text>

          <Text style={styles.h2}>7. Your Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your jurisdiction, you may have the right to access,
            correct, delete, or export your personal data, or to object to
            certain processing. Contact us to exercise these rights.
          </Text>

          <Text style={styles.h2}>8. Children’s Privacy</Text>
          <Text style={styles.paragraph}>
            Our web version is not intended for children under 13 (or under the
            minimum legal age in your region). We do not knowingly collect data
            from children under that age.
          </Text>

          <Text style={styles.h2}>9. International Transfers</Text>
          <Text style={styles.paragraph}>
            Information may be processed in countries other than your own. By
            using the web version you consent to such transfers.
          </Text>

          <Text style={styles.h2}>10. Links to Other Sites</Text>
          <Text style={styles.paragraph}>
            We may link to third‑party sites. We are not responsible for their
            privacy practices. Please review their policies before sharing
            personal data.
          </Text>

          <Text style={styles.h2}>11. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this policy. The effective date at the top will
            change, and we will notify users when required by law.
          </Text>

          <Text style={styles.h2}>12. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy, please contact us
            at:{" "}
            <Text style={styles.link} onPress={openEmail}>
              support@simdan.dev
            </Text>
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  container: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
    maxWidth: 900,
    alignSelf: "center",
  },
  h1: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
  effective: { color: "#333", marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: "700", marginTop: 18, marginBottom: 6 },
  paragraph: { fontSize: 16, color: "#111", marginBottom: 8, lineHeight: 22 },
  list: { marginBottom: 8 },
  li: { fontSize: 16, color: "#111", marginBottom: 6, lineHeight: 22 },
  bold: { fontWeight: "700" },
  link: { color: "#0066cc", textDecorationLine: "underline" },
});
