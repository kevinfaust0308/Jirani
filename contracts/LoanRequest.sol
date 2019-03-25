pragma solidity ^0.5.0;

contract LoanRequest {

    enum State {FUNDING, PAYING_BACK, COMPLETE}
    State public currentState;

    address payable public owner;
    address payable public requestee;
    string public reason;
    string public repaymentPlan;

    uint public amountAccumulated; // since the contract balance is always 0 (upon receiving we immediately payout)
    uint public amountRequested; // in wei
    uint public phoneNumber;
    address payable[] public loaners;
    uint[] public loanerAmounts;

    event LoanPaidOff(uint amountRequested, uint numLoaners);

    modifier requesteeOnly() { // reusable condition checks
        require(msg.sender == requestee);
        _; // body of the function this modifier is tacked to
    }


    constructor(address payable _owner, address payable _requestee, string memory _reason, string memory _repaymentPlan, uint _amountRequested, uint _phoneNumber) public {
        owner = _owner;
        requestee = _requestee;
        reason = _reason;
        repaymentPlan = _repaymentPlan;
        amountRequested = _amountRequested;
        phoneNumber = _phoneNumber;

        currentState = State.FUNDING;
    }

    function sendPayment() payable public {
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
        loaners.push(msg.sender);
        loanerAmounts.push(msg.value);

        // transfer the funds over to the loan requestee
        requestee.transfer(keptamount);

        // transfer the servicefee to the owner
        owner.transfer(fee);

        if (amountAccumulated == amountRequested) {
            currentState = State.PAYING_BACK;
        }
    }

    function repayLoan() payable public requesteeOnly {
        // requestee is ready to pay back the loaners
        require(currentState == State.PAYING_BACK);
        require(msg.value == amountRequested);

        for (uint i=0; i < loaners.length; i++) {
            loaners[i].transfer(loanerAmounts[i]);
        }

        // notify front end
        emit LoanPaidOff(amountRequested, loaners.length);

        // front end will make the sms

        currentState = State.COMPLETE;
    }

    function numLoaners() view public returns(uint) {
        return loaners.length;
    }

}