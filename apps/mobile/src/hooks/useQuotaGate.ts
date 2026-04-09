import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEntitlement } from './useSubscription';
import { useDialog } from '../components/AppDialog';
import type { MainStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/**
 * Returns a function that checks the user's scan quota.
 * If the quota is exceeded, shows an in-app dialog with a link to the Subscription screen.
 * Otherwise, calls the provided `proceed` callback.
 */
export function useQuotaGate() {
  const { data: entitlement } = useEntitlement();
  const navigation = useNavigation<Nav>();
  const { showDialog } = useDialog();

  return function checkQuota(proceed: () => void) {
    if (entitlement && !entitlement.canScan) {
      const limit = entitlement.scansAllowedThisMonth;
      showDialog({
        title: 'Scan Limit Reached',
        message: `You've used all ${limit} scans for this month. Upgrade your plan to get more.`,
        buttons: [
          { text: 'Not Now', style: 'cancel' },
          { text: 'View Plans', onPress: () => navigation.navigate('Subscription') },
        ],
      });
      return;
    }
    proceed();
  };
}
