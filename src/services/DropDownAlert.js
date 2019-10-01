import React, { createContext, useContext } from 'react';

const DropDownAlertContext = createContext(null);

export const DropDownAlertProvider = ({ dropDownAlert, children }) => {
  return (
    <DropDownAlertContext.Provider value={dropDownAlert}>
      {children}
    </DropDownAlertContext.Provider>
  );
};

export const useDropDownAlert = () => {
  return useContext(DropDownAlertContext);
};

export const useAlertError = (error) => {
  const dropDownAlert = useDropDownAlert();

  dropDownAlert.alertWithType('error', 'Error', error.message || error);
};
