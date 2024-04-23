import React from "react";
import { render, fireEvent, screen, waitFor, prettyDOM } from "@testing-library/react";
import VoteList from "../components/VoteList";
import { useAuthToken } from "../AuthTokenContext";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

jest.mock("../AuthTokenContext");

describe("VoteList Component Tests", () => {
  beforeEach(() => {
    useAuthToken.mockReturnValue({ accessToken: "fake-token" });
    global.fetch = jest.fn((url, options) => {
      if (
        url === `${process.env.REACT_APP_API_URL}/candidates` &&
        options.method === "GET"
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { name: "Trump", candidateType: "president", votesCount: 2},
              { name: "Swift", candidateType: "singer", votesCount: 3},
            ]),
        });
      }
      if (
        url === `${process.env.REACT_APP_API_URL}/votes` &&
        options.method === "POST"
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ userid: 1, candidateid:1 }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });

    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders and interacts correctly", async () => {
    render(<VoteList />);
    await waitFor(() => {
      expect(screen.getByText((content, element) => content.includes('Name'))).toBeInTheDocument();
    });
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Votes")).toBeInTheDocument();
    expect(screen.getByText("Vote")).toBeInTheDocument();
  });
});
