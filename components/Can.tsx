import { ReactNode } from "react"
import { useCan } from "../hooks/useCan";

type CanComponentProps = {
    children: ReactNode;
    permissions?: string[];
    roles?: string[];
}

export default function Can({ permissions = [], roles = [], children }: CanComponentProps) {
    const userCanSeeComponent = useCan({ permissions, roles })

    if (!userCanSeeComponent) {
        return null
    }

    return (
        <>
            {children}
        </>
    )
}