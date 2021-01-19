import '../styles/globals.css';
import '../styles/bootstrap-override.css';
import '../styles/theme-1.css';
import '../styles/theme-2.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
