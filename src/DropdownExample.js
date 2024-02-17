import React, { useEffect, useState } from 'react';

const DropdownExample = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [inheritFrom, setInheritFrom] = useState('');
  const [keyValuePairs, setKeyValuePairs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inheritValues, setInheritValues] = useState([]);


  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:3005/get-branches');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
        } else {
          console.error('Invalid branches format in API response:', data);
        }
      } else {
        throw new Error('Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };
  

//========================================================================================================
  
  const fetchInheritValues = async () => {
    try {
      const response = await fetch('http://localhost:3005/get-secrets');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.secretKeys) && data.secretKeys.length > 0) {
          setInheritValues(data.secretKeys);
        } else {
          console.error('Invalid inheritValues format in API response:', data);
        }
      } else {
        throw new Error('Failed to fetch inherit values');
      }
    } catch (error) {
      console.error('Error fetching inherit values:', error);
    }
  };

//==============================================================================================================

  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };
  const handleInheritFromChange = (event) => {
    setInheritFrom(event.target.value);
    deployApiForInherit(event.target.value);
  };


  //==================================================================
  //==================================================================
  //function to convert {"apiKey":"zxsdadwewew232@@#$dfdg","Env":"Prod","Ver":"11","Role":"Dev"}
  //into array of objects [ { key : "Env", value : "prod"}...]
  //==================================================================
  function convertObjectToArray(obj) {
    return Object.keys(obj).map(key => ({ key: key, value: obj[key] }));
  }

  function convertArrayToObject(arrayOfObjects) {
    const obj = {};
    arrayOfObjects.forEach(item => {
      obj[item.key] = item.value;
    });
    return obj;
  }
  
  //==================================================================
  //==================================================================


  
const deployApiForInherit = async (selectedInherit) => {
    try {
      const response = await fetch('http://localhost:3005/secrets-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "secretName": selectedInherit
        })
      });
  
      if (response.ok) {
        const data = await response.json();
        if (data && data.secrets) {
          const keyValues = convertObjectToArray(data.secrets);
          console.log("keyValues", keyValues);
          setKeyValuePairs(keyValues);
        } else {
          console.error('Invalid secrets data format in API response:', data);
        }
      } else {
        console.error('Failed to fetch data:', response.statusText);
        // Handle the error or throw it if you want to handle it elsewhere
      }
    } catch (error) {
      console.error('Error during fetch:', error);
      // Handle the error
    }
  };
  

  //========================================================
  //new key name is passed are params
  //========================================================
  //========================================================
  const addKeyValuePair = (key_name = "_new_key") => {
    setKeyValuePairs([...keyValuePairs, { key: `Key${keyValuePairs.length}`, value: '' }]);
    //========================================================
    //========================================================
  };
  const deleteKeyValuePair = (index) => {
    const updatedPairs = keyValuePairs.filter((_, i) => i !== index);
    setKeyValuePairs(updatedPairs);
  };

  const handleKeyChange = (key, value) => {
    console.log(key)
    setKeyValuePairs(prevArray =>
      prevArray.map(obj =>
        obj.key === key ? { ...obj, key: value } : obj
      )
    );
  };

  const handleValueChange = (key, value) => {
    setKeyValuePairs(prevArray =>
      prevArray.map(obj =>
        obj.key === key ? { ...obj, value: value } : obj
      )
    );
  };



  
  const deployApi = async () => {
    console.log(convertArrayToObject(keyValuePairs));
  
    try {
      const payload = {
        branch: selectedBranch,
        secretName: inheritFrom,
        secretValue: convertArrayToObject(keyValuePairs),
      };
  
      const response = await fetch('http://localhost:3005/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        console.log('API deployed successfully:', payload);
      } else {
        console.error('Failed to deploy API:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating API:', error);
    }
  };

  
  useEffect(() => {
    fetchBranches();
    fetchInheritValues();
  }, []);
  return (
    <div className='bg-white text-black'>
      <label htmlFor="branch">Select Branch:</label>
      <select id="branch" value={selectedBranch} onChange={handleBranchChange}>
        <option value="" disabled hidden>
          Choose a branch
        </option>
        {branches.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </select>
      <div style={{ marginBottom: '10px' }}></div>
      <label htmlFor="inheritFrom">Inherit from:</label>
      <select id="inheritFrom" value={inheritFrom} onChange={handleInheritFromChange}>
        <option value="" disabled hidden>
          Choose a value to inherit
        </option>
        {inheritValues.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {keyValuePairs.map((pair, index) => (
        <div key={index} className="key-value-pair">
          <input
            type="text"
            className='bg-yellow-500'
            placeholder={`Key ${index + 1}`}
            value={pair?.key}
            onChange={(e) => handleKeyChange(pair.key, e.target.value)}
          />
          <input
            type="text"
            className='bg-yellow-700'
            placeholder={`Value ${index + 1}`}
            value={pair?.value}
            onChange={(e) => handleValueChange(pair.key, e.target.value)}
          />
          <button onClick={() => deleteKeyValuePair(index)}>Delete</button>
        </div>
      ))}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={addKeyValuePair} style={{ marginRight: '5px' }}>
          ADD
        </button>
        <button onClick={deployApi}>Deploy</button>
      </div>
    </div>
  );
};
export default DropdownExample;




 

  

