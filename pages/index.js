import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Button from 'react-bootstrap/Button';
// pages/index.js
import { signIn, signOut, useSession } from 'next-auth/client'

export default function Home() {
  const [session, loading] = useSession();

  if (loading) {
    return <p>Loading...</p>
  }

  return(
    <div>
      <Jumbotron>
        <h1> Welcome to Watson Notes </h1>
        <h2/>
        <h3> A tag-based note taking and organizing app featuring suggestions from the world's favorite supercomputer! </h3>
        <br/>
        {!session && (
          <>
            <h4> Sign in with Google for quick, easy access! <br/> Or check out the live demo to see some example notes. </h4>
            <Button variant="primary-2" size="lg" onClick={signIn('google')}> Sign in </Button>
            <Button variant="success-2" size="lg" href="/mainpage"> Explore demo </Button>
          </>
        )}
        {session && (
          <>
            <h4> You're currently signed in as {""+session.user.email}!<br/> Continue to begin writing and organizing or sign out to view the demo.</h4>
            <Button variant="primary-2" href="/mainpage" size="lg"> Continue </Button>
            <Button variant="success-2" size="lg" onClick={signOut}> Sign out </Button>
          </>
        )}
      </Jumbotron>
    </div>
  )
}
