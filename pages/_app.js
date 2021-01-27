import '../styles/globals.css';
import '../styles/bootstrap-override.css';
import '../styles/theme-1.css';
import '../styles/theme-2.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Provider } from 'next-auth/client'

function MyApp({ Component, pageProps }) {
  return (
    <Provider session={pageProps.session}
    options={{
      clientMaxAge: 60,     // Re-fetch session if cache is older than 60 seconds
      keepAlive:    5 * 60 // Send keepAlive message every 5 minutes
    }} >
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp
