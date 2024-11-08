"use client"
import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const FormSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    pin: z.string().min(6, { message: "Your one-time password must be 6 characters." }),
})

const Login = ({ role }) => {
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
            pin: "",
        },
    })

    const [email, setEmail] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const router = useRouter()

    const handleFormSubmit = async (event) => {
        event.preventDefault()
        console.log(email)
        console.log(role)

        if (!otpSent) {
            // Send OTP
            try {
                const response = await axios.post('/api/auth/send-otp', {
                    email: email,
                    role: role
                })
                if (response.status === 200) {
                    toast.success("OTP sent successfully")
                    setOtpSent(true)
                } else {
                    toast.error("Error sending one-time password. Please try again later.")
                }
            } catch {
                toast.error("Error sending OTP")
            }
        } else {
            // Verify OTP
            try {
                const response = await axios.post('/api/auth/send-otp', {
                    email: email,
                    role: role,
                    otp: otp
                })
                if (response.status === 200) {
                    toast.success("OTP verified successfully")
                    // Redirect based on role
                    if (role === 'mentor') {
                        router.push('/pages/mentordashboard');
                    } else if (role === 'mentee') {
                        router.push('/pages/menteedashboard');
                    } else if (role === 'admin' || role === 'superadmin') {
                        router.push('/pages/admindashboard');
                    }
                    // router.push('/dashboard')
                } else {
                    toast.error(response.data.message)
                }
            } catch {
                toast.error("Error verifying OTP")
            }
        }
    }

    const handleOtpChange = (value) => {
        setOtp(value)
    }

    return (
        <div className='flex flex-col mt-20 gap-6 items-center justify-center text-center'>
            <ToastContainer />
            <Form {...form}>
                <form onSubmit={handleFormSubmit} className="w-2/3 space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Enter Your Email</FormLabel>
                                <FormControl>
                                    <div className='w-96'>
                                        <Input
                                            {...field}
                                            placeholder='Email'
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            name='email'
                                            className='w-full overflow-hidden text-ellipsis'
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Please enter Your Registered College Email.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {otpSent && (
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>One-Time Password</FormLabel>
                                    <FormControl>
                                        <InputOTP maxLength={6} {...field} value={otp} onChange={handleOtpChange}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormDescription>
                                        Please enter the one-time password sent to your email.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <Button type='submit'>
                        {otpSent ? 'Verify OTP' : 'Send OTP'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

export default Login