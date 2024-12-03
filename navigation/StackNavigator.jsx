import { createSharedElementStackNavigator } from 'react-navigation-shared-element';

const Stack = createSharedElementStackNavigator();

// In your navigator configuration
<Stack.Screen
  name="TransactionInfo"
  component={TransactionInfo}
  sharedElements={(route) => {
    const { transaction } = route.params;
    return [`transaction.${transaction.id}.image`];
  }}
/> 