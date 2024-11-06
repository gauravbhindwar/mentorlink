import React from 'react'
import { Button } from '../ui/button'
import { Label } from '@/components/ui/label';

const HomePage = () => {
    return (
        <div>
            <Label>Home Page</Label>

            <div>
                <div>
                    <Label>Home Page</Label>Login As Mentor
                </div>
                <Button>Mentor Login</Button>
            </div>
            <div>
                <div>
                    <Label>Home Page</Label>Login As Mentee
                </div>
                <Button>Mentee Login</Button>
            </div>
            <div>
                <div> Login As Admin
                </div>
                <Button>Admin Login</Button>
            </div>
        </div>
    )
}

export default HomePage
