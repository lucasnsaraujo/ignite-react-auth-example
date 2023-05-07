import { useContext, useEffect } from "react"
import { AuthContext } from "../../contexts/AuthContext"
import { api } from "../../services/apiClient"
import { withSSRAuth } from "../../utils/withSSRAuth"
import { GetServerSideProps } from "next"
import { setupAPIClient } from "../../services/api"
import { AuthTokenError } from "../../services/errors/AuthTokenError"
import { destroyCookie } from "nookies"

export default function Dashboard() {
    const { user } = useContext(AuthContext)

    useEffect(() => {
        api.get('/me').then(response => {
            console.log(response)
        })
            .catch(err => console.log(err))
    }, [])

    return (
        <h1>User: {user?.email}</h1>
    )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx)

    try {
        const response = await apiClient.get('/me')
    } catch (err) {
        destroyCookie(ctx, 'nextauth.token')
        destroyCookie(ctx, 'nextauth.refreshToken')

        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    return {
        props: {}

    }
})