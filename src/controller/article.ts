import { Request, Response } from "express";
import { stripe } from "../utils/stripe";
import Article from "../models/article";
import log from "../utils/logger";

export async function articleSession(req: Request, res: Response) {
  const customerId = res.locals.user.stripeCustomerId;
  const user = res.locals.user;

  if (user) {
    const subscriptions = await stripe.subscriptions.list(
      {
        customer: customerId,
        status: "all",
        expand: ["data.default_payment_method"],
      },
      {
        apiKey: process.env.STRIPE_SECRET_KEY,
      }
    );

    if (!subscriptions.data.length) return res.json([]);

    //@ts-ignore
    const plan = subscriptions.data[0].plan.nickname;

    if (plan === "Basic") {
      const articles = await Article.find({ access: "Basic" });
      return res.json(articles);
    } else if (plan === "Standard") {
      const articles = await Article.find({
        access: { $in: ["Basic", "Standard"] },
      });
      return res.json(articles);
    } else {
      const articles = await Article.find({});
      return res.json(articles);
    }
    res.json(plan);
  } else {
    log.error(`Invalid User`);
  }
}
