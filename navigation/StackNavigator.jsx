import { createStackNavigator } from '@react-navigation/stack';
import TransactionInfoScreen from '../screens/TransactionInfoScreen';

const Stack = createStackNavigator();

// In your navigator configuration
<Stack.Screen
  name="TransactionInfo"
  component={TransactionInfoScreen}
  options={{
    cardStyleInterpolator: ({ current: { progress } }) => ({
      cardStyle: {
        opacity: progress,
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      },
    }),
  }}
/> 