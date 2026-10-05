import rateLimit from "express-rate-limit";

export const rateLimitation = rateLimit({
    windowMs:2 * 60 * 1000, // 1st was 15 changed to 2
    limit:5,
    message: {
        message:"Too many request... traid to login later"
    }
})