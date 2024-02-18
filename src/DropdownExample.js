import React, { useEffect, useState } from 'react';

const DropdownExample = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [inheritFrom, setInheritFrom] = useState('');
  const [keyValuePairs, setKeyValuePairs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inheritValues, setInheritValues] = useState([]);
  const [selectedProject, setSelectedProject] = useState('cs-v3-frontend');
  const [inheritLabel, setInheritLabel] = useState('ENV variable from');
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(null);
  const [buildStatusLinkVisible, setBuildStatusLinkVisible] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [aborted, setAborted] = useState(false);
  const [buildNumber, setBuildNumber] = useState(null); 


  const fetchBranches = async () => {
    try {
      const response = await fetch('http://10.40.11.2:3005/get-branches');
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
      const response = await fetch('http://10.40.11.2:3005/get-secrets');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.secretKeys) && data.secretKeys.length > 0) {
          setInheritValues(data.secretKeys);

          // Check if there exists a secret specific to the selected branch
          const branchSpecificSecret = `cs/v3/frontend/${selectedBranch}`;
          if (data.secretKeys.includes(branchSpecificSecret)) {
            setInheritFrom(branchSpecificSecret);
            deployApiForInherit(branchSpecificSecret);
            setInheritLabel('ENV variable');
          } else {
            // Secret doesn't exist, show all secrets
            setInheritFrom('');
            setInheritLabel('ENV variable from');
          }
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

  useEffect(() => {
    fetchBranches();
    fetchInheritValues();
  }, [selectedBranch]);

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
    return Object.keys(obj).map((key) => ({ key: key, value: obj[key] }));
  }

  function convertArrayToObject(arrayOfObjects) {
    const obj = {};
    arrayOfObjects.forEach((item) => {
      obj[item.key] = item.value;
    });
    return obj;
  }

  //==================================================================
  //==================================================================

  const deployApiForInherit = async (selectedInherit) => {
    try {
      const response = await fetch('http://10.40.11.2:3005/secrets-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secretName: selectedInherit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.secrets) {
          const keyValues = convertObjectToArray(data.secrets);
          console.log('keyValues', keyValues);
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
  const addKeyValuePair = (key_name = '_new_key') => {
    setKeyValuePairs([...keyValuePairs, { key: `Key${keyValuePairs.length}`, value: '' }]);
    //========================================================
    //========================================================
  };
  const deleteKeyValuePair = (index) => {
    const updatedPairs = keyValuePairs.filter((_, i) => i !== index);
    setKeyValuePairs(updatedPairs);
  };

  const handleKeyChange = (key, value) => {
    console.log(key);
    setKeyValuePairs((prevArray) =>
      prevArray.map((obj) => (obj.key === key ? { ...obj, key: value } : obj))
    );
  };

  const handleValueChange = (key, value) => {
    setKeyValuePairs((prevArray) =>
      prevArray.map((obj) => (obj.key === key ? { ...obj, value: value } : obj))
    );
  };

  //=================================================================================================================================

  const checkBuildStatus = async () => {
    try {
        // Replace 'http://10.40.11.2:3005/check-build-status' with your actual POST API endpoint
        const response = await fetch('http://10.40.11.2:3005/check-build-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buildNumber: buildNumber, // Use the saved build number here
          }),
        });
      if (response.ok) {
        const data = await response.json();
        // Check if there's an object with status "success" in the array
        if (Array.isArray(data) && data.some(obj => obj.buildStatus === 'SUCCESS')) {
          console.log('Build successful!');
          // Clear the interval when the build is successful
          clearInterval(buildCheckInterval);
          setDeploySuccess(true);
          setBuildStatusLinkVisible(true);
          fetchDeployedUrl();
      } else if(Array.isArray(data) && data.some(obj => obj.buildStatus === 'FAILURE')){
        console.error('Build failed!');
        // Clear the interval when the build has failed
        clearInterval(buildCheckInterval);
        setDeploySuccess(false);
        setBuildStatusLinkVisible(true);
        
      }
      else if(Array.isArray(data) && data.some(obj => obj.buildStatus === 'ABORTED')){
        console.error('Build aborted!');
          // Clear the interval when the build is aborted
          clearInterval(buildCheckInterval);

          setAborted(true);
          setBuildStatusLinkVisible(true);
        
      }
      
      // Continue checking until the build status is success or failed
    } else {
      console.error('Failed to check build status:', response.statusText);
    }
  } catch (error) {
    console.error('Error checking build status:', error);
  }
};
  
//===================================


const fetchDeployedUrl = async () => {
    try {
      const response = await fetch('https://65cf05debdb50d5e5f5a4e0f.mockapi.io/url');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setDeployedUrl(data[0].url);
        } else {
          console.error('Invalid URL format in API response:', data);
        }
      } else {
        throw new Error('Failed to fetch deployed URL');
      }
    } catch (error) {
      console.error('Error fetching deployed URL:', error);
    }
  };
 

  //===================================================================================================================

  const deployApi = async () => {
    console.log(convertArrayToObject(keyValuePairs));
  
    try {
      const payload = {
        branch: selectedBranch,
        secretName: `cs/v3/frontend/${selectedBranch}`,
        secretValue: convertArrayToObject(keyValuePairs),
      };
  
      const response = await fetch('http://10.40.11.2:3005/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        console.log('API deployed successfully:', payload);
  
        // Set the buildNumber from the response
        const { buildNumber } = responseData;
        setBuildNumber(buildNumber);
        console.log('Build Number:', buildNumber);
  
        setDeploying(true);
        // Set interval to check build status every 5 seconds
        buildCheckInterval = setInterval(checkBuildStatus, 5000);
      } else {
        console.error('Failed to deploy API:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating API:', error);
    }
  };
  
  
  let buildCheckInterval;

  useEffect(() => {
    fetchBranches();
    fetchInheritValues();
  }, []);

  return (
    <div className='bg-white text-black'>
      <label htmlFor='project' style={{ marginBottom: '10px', display: 'block' }}>
        Project:
      </label>
      <select
        id='project'
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        style={{ width: '100%', marginBottom: '20px' }}
      >
        <option value='cs-v3-frontend'>cs-v3-frontend</option>
      </select>
      <label htmlFor="branch" style={{ marginBottom: '10px', display: 'block' }}>Select Branch:</label>
      <select id="branch" value={selectedBranch} onChange={handleBranchChange} style={{ width: '100%', marginBottom: '20px' }}>
        <option value="" disabled hidden>
          Choose a branch
        </option>
        {branches.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </select>
      <label htmlFor="inheritFrom" style={{ marginBottom: '10px', display: 'block' }}>
        {inheritLabel}:
      </label>
      <select id="inheritFrom" value={inheritFrom} onChange={handleInheritFromChange} disabled={!inheritValues.length} style={{ width: '100%', marginBottom: '20px' }}>
        <option value="" disabled hidden>
          Choose a value
        </option>
        {inheritFrom ? (
          <option key={inheritFrom} value={inheritFrom}>
            {inheritFrom}
          </option>
        ) : (
          // Otherwise, render all secrets
          inheritValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))
        )}
      </select>
      {keyValuePairs.map((pair, index) => (
        <div key={index} className="key-value-pair" style={{ display: 'flex', marginBottom: '10px' }}>
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
            style={{ width: 'calc(100% - 120px)' }}
          />
          <button onClick={() => deleteKeyValuePair(index)}>Delete</button>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'left', marginBottom: '20px' }}>
        <button onClick={addKeyValuePair}>
          Add Key
        </button>
      </div>


      <div style={{ display: 'flex', justifyContent: 'center' }}>
  {deploySuccess === true && (
    <button style={{ backgroundColor: '#4caf50', color: 'white', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', border: 'none' }}>
      Build successful
    </button>
  )}
  {deploySuccess === false && (
    <button style={{ backgroundColor: 'red', color: 'white', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', border: 'none' }}>
      Build Failed
    </button>
  )}
  {aborted === true && (
    <button style={{ backgroundColor: 'yellow', color: 'black', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', border: 'none' }}>
      Build Aborted
    </button>
  )}
  {deploySuccess === null && aborted === false && (
    <button onClick={deployApi} style={{ backgroundColor: '#3490dc', color: 'black', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', border: 'none' }}>
      {deploying ? 'Building progress...' : 'DEPLOY'}
    </button>
  )}
</div>


<div className='bg-white text-black'>
      
      {buildStatusLinkVisible && (
        <p>
          Click <a href="https://opshop.stage.multisafe.finance/job/coinshift-frontend-v3">here</a> for build status.
        </p>
      )}
    </div>

    {deploySuccess && (
        <div className="popup">
          <p>Deploy Url: <a href={deployedUrl} target="_blank">{deployedUrl}</a></p>
        </div>
      )}

    </div>
  );
};

export default DropdownExample;
