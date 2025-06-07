# Phase 1: Building the product

## Objective

An important channel of communication for shippers to submit their Request for Quotes (RFQs) to the freight forwarders is email. Being able to automatically process the RFQs coming via this channel is a must-have for Quotepilot.

The objective of the task is to build a system that receives RFQs submitted via email and extracts all the relevant information (such as origin and destination address) contained in it. The system will then consult different static data sources (spreadsheets) in order to calculate different transport options incl. routing and pricing. 

## Requirements

1. Parse any received email and extract the relevant information
2. Identify viable routing options from the origin to the delivery address (combination of road transport to and from airport (pickup and delivery), and airport-to-airport line haul)
3. Identify the fastest and cheapest options
4. Display the results

## **Scope limitations**

To simplify this exercise and reduce the effort involved in this challenge, we are taking steps to considerably simplify the use case compared to a real-world scenario, e.g.;

- We ignore significant parcel parameters such as: dimensions / metric volume, type of goods, # of pieces, and stackability, etc.
- For ground carrier prices for road transport, we assume one flat per Km fee, irrespective of the truck type.
- The scope only covers delivery requests with an origin address in DE and delivery address in MX. Goods can be trucked to airports outside Germany for air transport.
- Only these airports are supported:
    - Europe: FRA, MUC, AMS, CDG.
    - Mexico: MEX, NLU, GDL.
- Only these airlines are supported: Lufthansa (LH), Aeromexico (AM)
- We significantly reduce the depth of data involved (no non-working hours considerations, complex customs price components, AWB release fees, variety in ground handling partners or airline products, airport processes, etc.)

## Data sources

In a real world scenario, there are a lot more data points that would need to be considered, but for simplicity, we are offering a compressed rate sheet and flight schedules for you to use for this challenge.

- **Rate sheets and schedules**
    
    The document includes
    
    - Airport rates (export / import handling and customs)
    - Airlines rates
    - Trucking rates
    - Flight schedules
    
    [**Link to the sheet**](https://docs.google.com/spreadsheets/d/e/2PACX-1vRbGJssUDHOFAI3w7EMdrBVZzgu_stqnW5tHd4rB8WBwhvlXfkU9zJoXHLvPpTUF9dVBR_3VU26yFAf/pub?output=xlsx) 📚
    
- **Sample Emails**
    
    Additionally, we generated sample email requests that you can use to test the email system.
    
    [**Link to the email examples**](https://docs.google.com/document/d/e/2PACX-1vTI2_gIRPxgCrnimy9zD3BiWodlgdjOMAi-2fx9gnGdeSitAmmn5C4w1xu8WuYVb-kEHF7jJ1st9v6S/pub) ✉️
    

## Implementation

We expect the implementation to take no more than 6 ~ 10 hours. We will frame it as the first *proof of concept* of the product. Pragmatic decisions are expected, and whenever possible, corners should be cut. We are also interested in seeing what you choose to prioritise, and what you have decided to discard.

Feel free to make reasonable assumptions and take decisions on your own for the things that are not explicitly described here. If you notice any inconsistencies in the data, please don't hesitate to contact us or make reasonable assumptions.

You can use any technology, any library, any API that you have access to.

## Output & delivery

- The code should be accessible to the reviewers.
- The system will provide a hosted online access, allowing reviewers to interact with it and test it themselves through a browser, without the need to install anything.

Feel free to accompany the delivery with any explanation or visual representation of the implemented approach, as well as your thoughts, the decisions, and compromises you made.

## TODO
- [x] Create a new Next.js project
- [x] Create a new Prisma project
- [x] Create a new Vercel project
- [x] Setup tests for email parser
- [ ] Setup tests for Email Parsing API Route
