import React, { useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { spacing, radii } from '../theme';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@home-health-ai.com';

export function ContactForm() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(
    (user?.user_metadata?.full_name as string) ?? '',
  );
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit() {
    const body = `Name: ${fullName}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto);
  }

  const isValid = fullName.trim() && email.trim() && subject.trim() && message.trim();

  return (
    <View style={styles.container}>
      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
        textColor="#FFFFFF"
        outlineColor="#3A2020"
        activeOutlineColor="#C41E3A"
        theme={{ colors: { onSurfaceVariant: '#888888' } }}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        textColor="#FFFFFF"
        outlineColor="#3A2020"
        activeOutlineColor="#C41E3A"
        theme={{ colors: { onSurfaceVariant: '#888888' } }}
      />
      <TextInput
        label="Subject"
        value={subject}
        onChangeText={setSubject}
        mode="outlined"
        style={styles.input}
        textColor="#FFFFFF"
        outlineColor="#3A2020"
        activeOutlineColor="#C41E3A"
        theme={{ colors: { onSurfaceVariant: '#888888' } }}
      />
      <TextInput
        label="Message"
        value={message}
        onChangeText={setMessage}
        mode="outlined"
        multiline
        numberOfLines={5}
        style={[styles.input, styles.messageInput]}
        textColor="#FFFFFF"
        outlineColor="#3A2020"
        activeOutlineColor="#C41E3A"
        theme={{ colors: { onSurfaceVariant: '#888888' } }}
      />
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={!isValid}
        buttonColor="#C41E3A"
        textColor="#FFFFFF"
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Send
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: '#1C1212',
  },
  messageInput: {
    minHeight: 120,
  },
  button: {
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
