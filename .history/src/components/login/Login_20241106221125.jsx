"use client"
import React from 'react'
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
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
import { useRouter } from 'next/router'
const router = useRouter()
const FormSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    pin: z.string().min(6, { message: "Your one-time password must be 6 characters." }),
})

const Login = ({ handleLogin }) => {
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
            pin: "",
        },
    })


    function onSubmit(data) {
        handleLogin(data)
        toast({
            title: "You submitted the following values:",
            description: (
                <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                    <code className="text-white">{JSON.stringify(data, null, 2)}</code>
                </pre>
            ),
        })

        // Perform role-based redirection
        if (role === 'mentor') {
            router.push('/mentor-dashboard')
        } else if (role === 'mentee') {
            router.push('/mentee-dashboard')
        } else if (role === 'admin') {
            router.push('/admin-dashboard')
        } else if (role === 'hod') {
            router.push('/hod-dashboard')
        }
    }

    return (
        <div className='flex flex-col mt-20 gap-6 items-center justify-center text-center'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Enter Your Email</FormLabel>
                                <FormControl>
                                    <div className='w-96'>
                                        <Input {...field} placeholder='Email' type="email"
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
                    <FormField
                        control={form.control}
                        name="pin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>One-Time Password</FormLabel>
                                <FormControl>
                                    <InputOTP maxLength={6} {...field}>
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
                                    Please enter the one-time password sent to your phone.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    )
}

export default Login