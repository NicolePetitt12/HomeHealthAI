import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, radii } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void | Promise<void>;
}

export interface DialogOptions {
  title: string;
  message?: string;
  buttons?: DialogButton[];
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within <AppDialogProvider>');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const animateOut = useCallback(
    (onDone: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => onDone());
    },
    [fadeAnim, scaleAnim],
  );

  const showDialog = useCallback(
    (opts: DialogOptions) => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      setOptions(opts);
      setVisible(true);
    },
    [fadeAnim, scaleAnim],
  );

  const handlePress = useCallback(
    (button: DialogButton) => {
      animateOut(() => {
        setVisible(false);
        setOptions(null);
        button.onPress?.();
      });
    },
    [animateOut],
  );

  const dismiss = useCallback(() => {
    const cancelBtn = options?.buttons?.find((b) => b.style === 'cancel');
    animateOut(() => {
      setVisible(false);
      setOptions(null);
      cancelBtn?.onPress?.();
    });
  }, [options, animateOut]);

  const value = useMemo(() => ({ showDialog }), [showDialog]);

  // Default to a single OK button if none provided
  const buttons = options?.buttons?.length
    ? options.buttons
    : [{ text: 'OK', style: 'default' as DialogButtonStyle }];

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={dismiss}
        onShow={animateIn}
      >
        <Pressable style={styles.backdrop} onPress={dismiss}>
          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
            // Prevent taps on the card from dismissing
            onStartShouldSetResponder={() => true}
          >
            {/* Title */}
            <Text variant="titleMedium" style={styles.title}>
              {options?.title}
            </Text>

            {/* Message */}
            {options?.message ? (
              <Text variant="bodyMedium" style={styles.message}>
                {options.message}
              </Text>
            ) : null}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Buttons */}
            <View style={buttons.length > 2 ? styles.buttonsVertical : styles.buttonsRow}>
              {buttons.map((btn, i) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                return (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.button,
                      buttons.length <= 2 && styles.buttonFlex,
                      isDestructive && styles.buttonDestructive,
                      !isDestructive && !isCancel && styles.buttonPrimary,
                      pressed && styles.buttonPressed,
                      // Vertical separator between side-by-side buttons
                      i > 0 && buttons.length <= 2 && styles.buttonWithLeftBorder,
                    ]}
                    onPress={() => handlePress(btn)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                        isDestructive && styles.buttonTextDestructive,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#3A2020',
    overflow: 'hidden',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  message: {
    color: '#B0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  divider: {
    height: 1,
    backgroundColor: '#3A2020',
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  buttonsVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonPrimary: {},
  buttonDestructive: {},
  buttonPressed: {
    backgroundColor: '#2A1A1A',
  },
  buttonWithLeftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#3A2020',
  },
  buttonText: {
    color: '#C41E3A',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextCancel: {
    color: '#B0A0A0',
    fontWeight: '400',
  },
  buttonTextDestructive: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
});
