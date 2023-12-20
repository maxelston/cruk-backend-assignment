# How to use

Clone the repo and open in terminal. Then run

```
cdk synth
cdk bootstrap
cdk deploy
```

or use this url `https://jgn4wydgtkiwyqej4bwran6ucy0uhwea.lambda-url.eu-west-2.on.aws/`

Then in Postman or similar use the URL that is displayed on your terminal after a succesful deploy or my one provided and do a `POST` with these queries:
* name
* number (in this format +441234567890)

Please note that as a free AWS user I cannot send text messages via SNS however the cloudwatch logs confirm the snd was successful:

```
2023-12-20T16:06:28.424Z	f74e65cb-e3f8-4b6f-bca6-1c33298cf654	INFO	Successfully subscribed +31657058305 to topic arn:aws:sns:eu-west-2:475527340799:DonationTopic. Subscription ARN: arn:aws:sns:eu-west-2:475527340799:DonationTopic:7f5e11f4-5a5c-4bc4-ba4b-6bff755d7b0d
```

```
2023-12-20T16:06:28.502Z	f74e65cb-e3f8-4b6f-bca6-1c33298cf654	INFO	Successfully sent a text message to +31657058305.
```

I started building a frontend to submit to but was having issues with CORS - this was my first time using CDK so had some complications there

Unfortunately I did not get round to doing any tests

# Scalability

Some things I would work on if I had more time for scalability:

- Use Batch Operations with DynamoDB and handle data in chunks
- Improve my logs and message feedback
- SNS configurtion to use FIFO topics
- More specific IAM roles to improve security
- Set up CloudWatch Alarms
- Use partitioning strategies to optimise the DB
