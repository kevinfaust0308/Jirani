/***
 * Formatsarray of [loan request address, raw loan request data] into an array of formatted loan request data
 *
 * @param lrads array of [loan request address, raw loan request data] fetched from the smart contract
 * @param you address of your account
 * @returns {Array}
 */
function formatLoanRequestData(lrads, you = null) {

    let res = [];

    // create a list of objects of the actual loan request data in nice format
    for (const [lra, lrd] of lrads) {

        // unpack and convert values to appropriate format
        const amountReq = web3.utils.fromWei(lrd[1].toString()); // wei to eth. avoid huge number handling
        const amountAcc = web3.utils.fromWei(lrd[2].toString());
        const numLoaners = lrd[6].toNumber();

        // unpack and rename to the following new variable names
        const {0: requestee, 3: title, 4: reason, 5: repaymentPlan, 7: currentState} = lrd;

        const lr = {};
        lr.lra = lra; // store the address of the contract too
        lr.isYours = you ? requestee === you : true; // whether or not this loan request belongs to you. if null then default True
        lr.title = title;
        lr.reason = reason;
        lr.repaymentPlan = repaymentPlan;
        lr.currentState = currentState;
        lr.amountAcc = amountAcc;
        lr.amountReq = amountReq;
        lr.prog = parseFloat(amountAcc) / parseFloat(amountReq) * 100;
        lr.numLoaners = numLoaners;

        console.log("%s | Request %s/%s because of %s. Backed by %d (%s)", title, amountAcc, amountReq, reason, numLoaners, currentState);
        res.push(lr);
    }

    return res;

}