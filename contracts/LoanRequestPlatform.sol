pragma solidity ^0.5.0;


import "./LoanRequest.sol";

contract LoanRequestPlatform {

    // master escrow
    address payable public owner;

    // all the loan request contracts
    LoanRequest[] public contracts;

    // mapping between user and their loans
    mapping(address => LoanRequest[]) internal loanRequestMapping;


    modifier ownerOnly() {
        require(owner == msg.sender);
        _;
    }


    constructor() public {
        owner = msg.sender;
    }

    // for displaying all the contracts on the UI
    function extractLoanRequestContractData(address _contract) view public ownerOnly returns (address, uint, uint, string memory, string memory, uint){

        LoanRequest lr = LoanRequest(_contract);

        // requestee -> to display on UI and so when a person wants to loan money, we know the destination address
        return (lr.requestee(), lr.amountRequested(), lr.amountAccumulated(), lr.reason(), lr.repaymentPlan(), lr.numLoaners());

    }


    function requestLoan(string memory _reason, string memory _repaymentPlan, uint _amountRequested, uint _phoneNumber) public {
        // create a new requestloan contract
        LoanRequest lr = new LoanRequest(owner, msg.sender, _reason, _repaymentPlan, _amountRequested, _phoneNumber);
        contracts.push(lr);
        // record that this sender has created a loan
        loanRequestMapping[msg.sender].push(lr);
    }

    // when on home page and you call this, gets a list of all your contract addresses. loop through each and get the contract data
    function getYourLoanRequestContracts() view public returns(LoanRequest[] memory) {
        return loanRequestMapping[msg.sender];
    }

    // functions below are just calls to the LoanRequest contract
    function sendPayment(address _contract) payable public {
        LoanRequest lr = LoanRequest(_contract);
        lr.sendPayment.value(msg.value)(); // transfer fund from this contract to the loan request

    }

    function repayLoan(address _contract) payable public {
        LoanRequest lr = LoanRequest(_contract);
        lr.repayLoan.value(msg.value)(); // transfer fund from this contract to the loan request
    }


}
