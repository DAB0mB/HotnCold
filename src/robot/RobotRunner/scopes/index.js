import { useSignOut } from '../../../services/Auth';
import { useRobot } from '../../context';
import useDiscoveryScope from './discovery';
import useProfileScope from './profile';

export default () => {
  const { scope, before } = useRobot();

  scope('Hot&Cold', () => {
    const signOut = useSignOut();

    before(async () => {
      await signOut();
    });

    useProfileScope();
    useDiscoveryScope();
  });
};
