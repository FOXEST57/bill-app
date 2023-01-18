/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore); // @pde grace à la fonction jest.mock 'bibliotheque jest' on remplace le store par mockStore qui nous permtra de simuler store avec les données que l'on souihaite sans devoir l'executer

const setNewBill = () => {
  return new NewBill({
    document,
    onNavigate,
    store: mockStore,
    localStorage: window.localStorage,
  });
};

beforeAll(() => { // @ pde est créé une seul fois pour tous les tests
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

beforeEach(() => {  // @pde permet a cette fonction d'être utilisé par chaque test
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();

  document.body.innerHTML = NewBillUI();

  window.onNavigate(ROUTES_PATH.NewBill);
});

afterEach(() => { // @pde efface tous ce qui a été créé dans le beforeEach
  jest.resetAllMocks();
  document.body.innerHTML = "";
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then newBill icon in vertical layout should be highlighted", () => {
      const windowIcon = screen.getByTestId("icon-mail");

      expect(windowIcon).toHaveClass("active-icon");
    });

  

    // @pde - Kaban 7 test
    describe("When I do fill fields in correct format and I click on submit button", () => {
      test("Then the submission process should work properly, and I should be sent on the Bills Page", async () => {
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const inputData = bills[0];

        const newBillForm = screen.getByTestId("form-new-bill");

        const handleSubmit = jest.fn(newBill.handleSubmit);
        const imageInput = screen.getByTestId("file");

        const file = getFile(inputData.fileName, ["image/jpg"])

        const fileValidation = jest.spyOn(newBill, "fileValidation");

        // On remplit les champs
        selectExpenseType(inputData.type);
        userEvent.type(getExpenseName(), inputData.name);
        userEvent.type(getAmount(), inputData.amount.toString());
        userEvent.type(getDate(), inputData.date);
        userEvent.type(getVat(), inputData.vat.toString());
        userEvent.type(getPct(), inputData.pct.toString());
        userEvent.type(getCommentary(), inputData.commentary);
        await userEvent.upload(imageInput, file);

        // On s'assure que les données entrées requises sont valides
        expect(
          selectExpenseType(inputData.type).validity.valueMissing
        ).toBeFalsy();
        expect(getDate().validity.valueMissing).toBeFalsy();
        expect(getAmount().validity.valueMissing).toBeFalsy();
        expect(getPct().validity.valueMissing).toBeFalsy();
        expect(fileValidation(file)).toBeTruthy();

        newBill.fileName = file.name;

        // On s'assure que le formulaire est soumettable
        const submitButton = screen.getByRole("button", { name: /envoyer/i });
        expect(submitButton.type).toBe("submit");

        // On soumet le formulaire
        newBillForm.addEventListener("submit", handleSubmit);
        userEvent.click(submitButton);

        expect(handleSubmit).toHaveBeenCalledTimes(1);

        // On s'assure qu'on est bien renvoyé sur la page Bills
        expect(screen.getByText(/Mes notes de frais/i)).toBeVisible();
      });

      test("Then a new bill should be created", async () => {
        const createBill = jest.fn(mockStore.bills().create);
        const updateBill = jest.fn(mockStore.bills().update);

        const { fileUrl, key } = await createBill();

        expect(createBill).toHaveBeenCalledTimes(1);

        expect(key).toBe("1234");
        expect(fileUrl).toBe("https://localhost:3456/images/test.jpg");

        const newBill = updateBill();

        expect(updateBill).toHaveBeenCalledTimes(1);

        await expect(newBill).resolves.toEqual({
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        });
      });
    });

    // @pde  Valeur par défaut champ PCT 
   

    describe("When nothing has been typed in PCT input", () => {
      test("then the PCT should be 20 by default", () => {
        const newBill = setNewBill();

        const inputData = bills[0];

        const newBillForm = screen.getByTestId("form-new-bill");

        const handleSubmit = jest.spyOn(newBill, "handleSubmit");
        const updateBill = jest.spyOn(newBill, "updateBill");

        newBill.fileName = inputData.fileName;

        newBillForm.addEventListener("submit", handleSubmit);

        fireEvent.submit(newBillForm);

        expect(handleSubmit).toHaveBeenCalledTimes(1);

        expect(updateBill).toHaveBeenCalledWith(
          expect.objectContaining({
            pct: 20,
          })
        );
      });
    });

    
    // @pde Champs non remplis
    

    describe("When I do not fill fields and I click on submit button", () => {
      test("Then it should stay on newBill page", () => {
        const newBill = setNewBill();

        const newBillForm = screen.getByTestId("form-new-bill");

        const handleSubmit = jest.spyOn(newBill, "handleSubmit");

        newBillForm.addEventListener("submit", handleSubmit);
        fireEvent.submit(newBillForm);

        expect(handleSubmit).toHaveBeenCalledTimes(1);

        expect(newBillForm).toBeVisible();
      });
    });

   
    // @pde Mauvais format de fichier uploadé 
   

    describe("When I am on NewBill page and I upload a file with an extension other than jpg, jpeg or png", () => {
      test("Then an error message for the file input should be displayed", () => {
        const newBill = setNewBill();

        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
        const imageInput = screen.getByTestId("file");
        const fileValidation = jest.spyOn(newBill, "fileValidation");

        imageInput.addEventListener("change", handleChangeFile);

        fireEvent.change(imageInput, {
          target: {
            files: [
              new File(["document"], "document.pdf", {
                type: "application/pdf",
              }),
            ],
          },
        });

        expect(handleChangeFile).toHaveBeenCalledTimes(1);
        expect(fileValidation.mock.results[0].value).toBeFalsy();

        expect(imageInput).toHaveClass("is-invalid");
      });
    });

   
    // @pde Bon format de fichier uploadé 
    

    describe("When I am on NewBill page and I upload a file with an extension jpg, jpeg or png", () => {
      test("Then no error message for the file input should be displayed", () => {
        const newBill = setNewBill();

        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
        const imageInput = screen.getByTestId("file");
        const fileValidation = jest.spyOn(newBill, "fileValidation");

        imageInput.addEventListener("change", handleChangeFile);

        fireEvent.change(imageInput, {
          target: {
            files: [
              new File(["image"], "image.jpg", {
                type: "image/jpg",
              }),
            ],
          },
        });

        expect(handleChangeFile).toHaveBeenCalledTimes(1);
        expect(fileValidation.mock.results[0].value).toBeTruthy();

        expect(imageInput).not.toHaveClass("is-invalid");
      });
    });

    describe("When an error occurs on API", () => {
      test("Then new bill is added to the API but fetch fails with '404 page not found' error", async () => {
        const newBill = setNewBill();

        const mockedBill = jest
          .spyOn(mockStore, "bills")
          .mockImplementationOnce(() => {
            return {
              create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
            };
          });

        await expect(mockedBill().create).rejects.toThrow("Erreur 404");

        expect(mockedBill).toHaveBeenCalledTimes(1);

        expect(newBill.billId).toBeNull();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      });

      test("Then new bill is added to the API but fetch fails with '500 Internal Server error'", async () => {
        const newBill = setNewBill();

        const mockedBill = jest
          .spyOn(mockStore, "bills")
          .mockImplementationOnce(() => {
            return {
              create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
            };
          });

        await expect(mockedBill().create).rejects.toThrow("Erreur 500");

        expect(mockedBill).toHaveBeenCalledTimes(1);

        expect(newBill.billId).toBeNull();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      });
    });
  });
});


// @pde UTILS 


const selectExpenseType = expenseType => {
  const dropdown = screen.getByRole("combobox");
  userEvent.selectOptions(
    dropdown,
    within(dropdown).getByRole("option", { name: expenseType })
  );
  return dropdown;
};

const getExpenseName = () => screen.getByTestId("expense-name");

const getAmount = () => screen.getByTestId("amount");

const getDate = () => screen.getByTestId("datepicker");

const getVat = () => screen.getByTestId("vat");

const getPct = () => screen.getByTestId("pct");

const getCommentary = () => screen.getByTestId("commentary");

const getFile = (fileName, fileType) => {
  const file = new File(["img"], fileName, {
    type: [fileType],
  });

  return file;
};
