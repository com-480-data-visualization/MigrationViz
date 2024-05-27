# Imports 

import pandas as pd

def import_file(file, tables, skiprows=10):
    """
    From the specified files, import in a dictonary each table, the key being the sheet name

    Parameters:
    - file: excel file total path
    - tables: dictionnary containing the name of the tables

    Returns:
    - dictionnary containing each table as a dataframe
    """
    dataframe = {}
    for sheet_name in tables.keys():
        df = pd.read_excel(file, sheet_name=sheet_name, index_col=0, skiprows=skiprows, na_values='..')
        df.rename(columns= {"Region, development group, country or area":"Region"}, inplace=True)
        dataframe[sheet_name] = df
    return dataframe


# WORK IN PROGRESS 
def add_continent_sub_regions(dataframe, location_codes):
    """
    Add to the given dataframe a column "sub_region" and a column "continent", based on the code retrieved in the dataframe, and the correspondence to the value in the dataframe location_codes

    Parameters:
    - dataframe: the dataframe to which you add columns
    - location_codes: dataframe with the information to add

    """
    dataframe['sub_region'] = ...
