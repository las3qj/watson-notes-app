// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

const options = {
  site: process.env.NEXTAUTH_URL,
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    redirect: async (url, _) => {
      console.log(url);
      if (url === '/api/auth/signin') {
        return Promise.resolve('/mainpage');
      }
    },
  },
  database: process.env.DATABASE_URL
}

export default (req, res) => NextAuth(req, res, options)
