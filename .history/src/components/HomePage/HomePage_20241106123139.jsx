import React from 'react'
import { Button } from '../ui/button'
import { Label } from '@/components/ui/label';

const HomePage = () => {
    return (
        <div className='flex flex-col mt-20 gap-6 items-center justify-center text-center'>


            <div>
                <div>
                    <Label>Login As Mentor</Label>
                </div>
                <Button>Mentor Login</Button>
            </div>
            <div>
                <div>
                    <Label>Login As Mentee</Label>
                </div>
                <Button>Mentee Login</Button>
            </div>
            <div>
                <div>
                    <Label>Login As Admin</Label>
                </div>
                <Button>Admin Login</Button>
            </div>
        </div>
    )
}

export default HomePage
