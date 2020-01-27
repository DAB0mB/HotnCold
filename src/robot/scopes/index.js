import { useSignOut } from '../../services/Auth';
import { scope, before } from '../runner';
import useDiscoveryScope from './discovery';
import useProfileScope from './profile';

export default () => {
  scope('Hot&Cold', () => {
    const signOut = useSignOut();

    before(async () => {
      await signOut();
    });

    useProfileScope();
    useDiscoveryScope();
  });
};
