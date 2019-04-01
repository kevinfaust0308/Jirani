var app = new Vue({
    el: '#allLoans',
    data: {
        allLoans: [],
        displayedLoan: {
            'willPay': 0, // so that vue can be bound to this (in ETH)
        },
    },
    methods: {
        updateModal: function (loan) {
            // dynamic progress bar setup
            loan.prog = parseFloat(loan.amountAcc) / parseFloat(loan.amountReq) * 100;
            this.displayedLoan = loan;
        },
    },
    computed: {
        validPayAmt: function () {
            // positive value less than remaining amount needed
            return (0 < parseFloat(this.displayedLoan.willPay)) &&
                (parseFloat(this.displayedLoan.willPay) <= parseFloat(this.displayedLoan.amountReq) - parseFloat(this.displayedLoan.amountAcc));
        }
    }
});


App = {

    web3Provider: null,
    contracts: {},

    init: () => {
        console.log("App.init()");
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof web3 !== 'undefined') { // check if injected web3 provider such as metamask
            App.web3Provider = web3.currentProvider;
            console.log("found existing web3 provider");
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            console.log("connecting to local Ganache");
        }
        web3 = new Web3(App.web3Provider);
        console.log("initialized web3 instance");
        return App.initContract();
    },

    initContract: () => {

        $.getJSON("LoanRequestPlatform.json", (data) => {
            // This creates an instance of the contract we can interact with.
            App.contracts.loanRequestPlatform = TruffleContract(data);
            // Set the provider for our contract
            App.contracts.loanRequestPlatform.setProvider(App.web3Provider);
            console.log("initialized loan request platform contract");

            return App.initUI();
        });
    },


    initUI: async () => {

        console.log("App.initUI()");

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        const acct = (await web3.eth.getAccounts())[0];

        const numLoans = await loanRequestPlatformInstance.numContracts();
        console.log("There are " + numLoans + " total loans");

        for (let i = 0; i < numLoans; i++) {
            // get ith contract's address
            const addr = await loanRequestPlatformInstance.contracts(i);
            // get the actual contents
            const res = await loanRequestPlatformInstance.extractLoanRequestContractData(addr);
            console.log(res);


            // unpack and convert values to appropriate format
            const amountReq = web3.utils.fromWei(res[1].toString()); // wei to eth. avoid huge number handling
            const amountAcc = web3.utils.fromWei(res[2].toString());
            const numLoaners = res[6].toNumber();

            // unpack and rename to the following new variable names
            const {0: requestee, 3: title, 4: reason, 5: repaymentPlan} = res;

            // // we wont be displaying our own loans
            // if (acct === requestee) {
            //     continue;
            // }


            let loanobj = {
                'addr': addr, // unique identifier for loaning
                'title': title,
                'reason': reason,
                'repaymentPlan': repaymentPlan,
                'amountReq': amountReq,
                'amountAcc': amountAcc,
                'numLoaners': numLoaners
            };
            app.allLoans.push(loanobj);
        }

        return App.bindEvents();
    },


    bindEvents: () => {

        $('#submit').click(e => {
            App.loanPay();
        })

    },


    loanPay: async () => {
        // at this point, we already have a displayed loan with all the needed information to make a payment

        console.log("loan payment pending");
        toggleFormSubmit(true);

        const acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        let displayedLoanAddr = app.displayedLoan.addr;
        let payAmt = app.displayedLoan.willPay;
        console.log("Paying %s ETH to %s", payAmt, displayedLoanAddr);


        try {

            // get an estimate of the gas to use
            const gas = await loanRequestPlatformInstance.sendPayment.estimateGas(displayedLoanAddr, {
                from: acct,
                value: web3.utils.toWei(payAmt)
            });
            // perform transaction using the gas estimate
            const tx = await loanRequestPlatformInstance.sendPayment(displayedLoanAddr, {
                from: acct,
                gas: gas,
                value: web3.utils.toWei(payAmt)
            });

            console.log(tx);
            console.log("loan payment success");

            window.location.href = "viewloans.html"

        } catch (err) {
            console.log(err);
            toggleFormSubmit(false);
        }

    },


};

$(window).on("load", function () {

    App.init();

});

