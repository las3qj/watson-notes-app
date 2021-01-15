import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <Link href="/create-new-page">
      <a>
        <h1>Input test &rarr;</h1>
        <p>Test Watson's NLP on some custom input.</p>
      </a>
    </Link>
  )
}
