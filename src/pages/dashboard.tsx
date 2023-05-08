import { useContext, useEffect } from "react"
import { AuthContext } from "../../contexts/AuthContext"
import { api } from "../../services/apiClient"
import { withSSRAuth } from "../../utils/withSSRAuth"
import { setupAPIClient } from "../../services/api"
import Can from "../../components/Can"

export default function Dashboard() {
    const { user, signOut } = useContext(AuthContext)

    useEffect(() => {
        api.get('/me').then(response => {
            console.log(response)
        })
            .catch(err => console.log(err))
    }, [])

    return (
        <>
            <h1>Dashboard</h1>
            <h2>Current user: {user?.email}</h2>
            <Can permissions={['metrics.list']}>
                User has metrics.list.
            </Can>
            <br />
            <br />
            <button onClick={() => signOut()}>Sign out</button>
        </>
    )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx)
    const response = await apiClient.get('/me')

    return {
        props: {}

    }
})