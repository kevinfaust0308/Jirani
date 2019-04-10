pragma solidity ^0.5.0;

contract LoanRequest {

    enum State {FUNDING, PAYING_BACK, COMPLETE}
    State public currentState;

    address payable public requestee;
    string public title;
    string public reason;
    string public repaymentPlan;

    uint public amountAccumulated; // since the contract balance is always 0 (upon receiving we immediately payout)
    uint public amountRequested; // in wei
    uint public phoneNumber;

    address payable private owner;
    address payable[] public loaners;
    uint[] private loanerAmounts;

    constructor(address payable _owner, address payable _requestee, string memory _title, string memory _reason, string memory _repaymentPlan, uint _amountRequested, uint _phoneNumber) public {
        owner = _owner;
        requestee = _requestee;
        title = _title;
        reason = _reason;
        repaymentPlan = _repaymentPlan;
        amountRequested = _amountRequested;
        phoneNumber = _phoneNumber;

        currentState = State.FUNDING;
    }

    function sendPayment(address payable sender) payable public {

        require(sender != requestee); // why are you funding your own loan. no

        // still requiring money
        require(currentState == State.FUNDING);
        // amount provided is less than the remaining amount
        require(msg.value > 0);
        require(msg.value <= (amountRequested - amountAccumulated));

        amountAccumulated += msg.value;

        // split up the msg.value and pay it out
        uint fee = msg.value * 3 / 100;
        uint keptamount = msg.value - fee;

        // record this loaner and the amount they gave
        loaners.push(sender);
        loanerAmounts.push(msg.value);

        // transfer the funds over to the loan requestee
        requestee.transfer(keptamount);

        // transfer the servicefee to the owner
        owner.transfer(fee);

        if (amountAccumulated == amountRequested) {
            currentState = State.PAYING_BACK;
        }
    }

    function repayLoan(address sender) payable public {

        require(sender == requestee); // person repaying should obviously be the person that requested the loan

        // requestee is ready to pay back the loaners
        require(currentState == State.PAYING_BACK);
        require(msg.value == amountRequested);

        for (uint i=0; i < loaners.length; i++) {
            loaners[i].transfer(loanerAmounts[i]);
        }

        // front end will make the sms

        currentState = State.COMPLETE;
    }

    function numLoaners() view public returns(uint) {
        return loaners.length;
    }

    function getCurrentState() view public returns(string memory) {
        if (currentState == State.FUNDING) {
            return "Funding";
            //return 0;
        } else if (currentState == State.PAYING_BACK) {
            return "Paying back";
            //return 1;
        } else if (currentState == State.COMPLETE) {
            return "Complete";
            //return 2;
        }
    }

}